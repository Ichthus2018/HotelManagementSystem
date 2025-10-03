// src/components/ui/common/StarRatingInput.jsx

import React from "react";

const StarRatingInput = ({ rating, onRatingChange }) => {
  return (
    <div className="mt-1 flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          // Call the function passed via props with the new value
          onClick={() => onRatingChange(star)}
          className={`p-2 rounded-lg border-2 transition-all ${
            // Use the 'rating' prop to determine the style
            rating === star
              ? "border-yellow-400 bg-yellow-50 text-yellow-600"
              : "border-gray-300 text-gray-400 hover:border-yellow-300 hover:text-yellow-500"
          }`}
          aria-label={`${star} star rating`}
        >
          <span className="font-bold text-lg">{star} ★</span>
        </button>
      ))}
      <button
        type="button"
        // Set the rating to 0 or another value that signifies "cleared"
        onClick={() => onRatingChange(0)}
        className="p-2 text-sm text-gray-500 hover:text-gray-700"
        aria-label="Clear rating"
      >
        Clear
      </button>
    </div>
  );
};

export default StarRatingInput;
