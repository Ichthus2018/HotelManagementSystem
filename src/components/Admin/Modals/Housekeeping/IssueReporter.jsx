// src/components/Housekeeping/IssueReporter.js

import { useState } from "react";
import supabase from "../../../../services/supabaseClient";
import {
  IoIosWarning,
  IoMdCamera,
  IoIosAddCircle,
  IoIosTrash,
} from "react-icons/io";

// A unique ID generator for list keys, as we don't have a DB id yet.
const generateTemporaryId = () => `temp_${Date.now()}_${Math.random()}`;

const IssueReporter = ({ room, currentUser }) => {
  // State for the current issue being typed
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState(null);

  // State for the list of issues to be submitted
  const [issues, setIssues] = useState([]);

  // State for the submission process
  const [submissionStatus, setSubmissionStatus] = useState("idle"); // idle, submitting, success, error
  const [error, setError] = useState(null);

  const handleAddIssue = (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newIssue = {
      id: generateTemporaryId(), // Temporary ID for React key prop
      description: description.trim(),
      photoFile: photoFile,
    };

    setIssues((prevIssues) => [...prevIssues, newIssue]);

    // Reset form fields
    setDescription("");
    setPhotoFile(null);
    document.getElementById(`issue-photo-input-${room.id}`).value = ""; // Clear file input
  };

  const handleRemoveIssue = (issueId) => {
    setIssues((prevIssues) =>
      prevIssues.filter((issue) => issue.id !== issueId)
    );
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSubmitAllIssues = async () => {
    if (issues.length === 0) return;

    setSubmissionStatus("submitting");
    setError(null);

    try {
      // 1. Handle all image uploads first
      const issuesWithImageUrls = await Promise.all(
        issues.map(async (issue) => {
          if (!issue.photoFile) {
            return { ...issue, imageUrl: null };
          }

          const file = issue.photoFile;
          const fileExt = file.name.split(".").pop();
          const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
          const filePath = `public/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("issue-images") // **MAKE SURE THIS BUCKET EXISTS**
            .upload(filePath, file);

          if (uploadError) {
            throw new Error(
              `Failed to upload ${file.name}: ${uploadError.message}`
            );
          }

          const { data: urlData } = supabase.storage
            .from("issue-images")
            .getPublicUrl(filePath);

          return { ...issue, imageUrl: urlData.publicUrl };
        })
      );

      // 2. Prepare data for insertion
      const issuesToInsert = issuesWithImageUrls.map((issue) => ({
        room_id: room.id,
        reported_by: currentUser.id,
        description: issue.description,
        image_url: issue.imageUrl,
      }));

      // 3. Insert all records into the database
      const { error: insertError } = await supabase
        .from("room_issues")
        .insert(issuesToInsert);

      if (insertError) {
        throw insertError;
      }

      setSubmissionStatus("success");
      setIssues([]); // Clear the list after successful submission
    } catch (err) {
      console.error("Error submitting issues:", err);
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
      setSubmissionStatus("error");
    }
  };

  if (submissionStatus === "success") {
    return (
      <div className="p-4 text-center text-green-800 bg-green-100 rounded-lg">
        <p className="font-semibold">
          Thank you! Your issue(s) have been reported.
        </p>
        <button
          onClick={() => setSubmissionStatus("idle")}
          className="mt-2 text-sm text-green-700 hover:underline"
        >
          Report another issue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
        <IoIosWarning className="text-yellow-500" size={20} /> Report an Issue
      </h4>

      {/* List of Added Issues */}
      {issues.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-600">
            Pending Reports:
          </h5>
          <ul className="divide-y divide-gray-200 border rounded-md p-2 bg-gray-50">
            {issues.map((issue) => (
              <li
                key={issue.id}
                className="flex items-center justify-between py-2 px-1"
              >
                <div className="flex-1 text-sm text-gray-800">
                  <p>{issue.description}</p>
                  {issue.photoFile && (
                    <p className="text-xs text-gray-500 truncate">
                      Photo: {issue.photoFile.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveIssue(issue.id)}
                  className="ml-4 text-red-500 hover:text-red-700"
                >
                  <IoIosTrash size={20} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Form to Add a New Issue */}
      <form
        onSubmit={handleAddIssue}
        className="p-3 border rounded-lg space-y-3 bg-white"
      >
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
          placeholder="Describe the issue (e.g., TV has cracks)..."
          className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500"
          required
        />
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <label
            htmlFor={`issue-photo-input-${room.id}`}
            className="flex-1 w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <IoMdCamera size={18} />
            {photoFile ? `${photoFile.name}` : "Attach Photo (Optional)"}
          </label>
          <input
            id={`issue-photo-input-${room.id}`}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <button
            type="submit"
            disabled={!description.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            <IoIosAddCircle size={18} />
            Add Issue to Report
          </button>
        </div>
      </form>

      {/* Button to Submit All Issues */}
      {issues.length > 0 && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleSubmitAllIssues}
            disabled={submissionStatus === "submitting"}
            className="w-full inline-flex justify-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-700 disabled:bg-yellow-300"
          >
            {submissionStatus === "submitting"
              ? "Submitting..."
              : `Submit ${issues.length} Reported Issue(s)`}
          </button>
          {submissionStatus === "error" && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default IssueReporter;
