import React, { useState, useEffect, useCallback } from "react";
import { Star, ShoppingBag, AlertCircle } from "lucide-react";
import apiClient from "../services/apiService";

function ProductRating({ productId, onRatingUpdate }) {
  const [ratingInfo, setRatingInfo] = useState(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchRatingInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/product/${productId}/rating`);
      setRatingInfo(response.data);
    } catch (error) {
      console.error("Error fetching rating info:", error);
      setMessage({
        type: "error",
        text: "Failed to load ratings",
      });
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchRatingInfo();
  }, [fetchRatingInfo]);

  const handleRating = async (rating) => {
    if (!ratingInfo?.canUserRate) {
      setMessage({
        type: "error",
        text: "You must purchase this product before rating it",
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (submitting) return;

    try {
      setSubmitting(true);
      await apiClient.post("/product/rate", {
        productId: productId,
        rating: rating,
      });

      setMessage({
        type: "success",
        text: ratingInfo.hasUserRated
          ? "Rating updated successfully!"
          : "Thank you for rating!",
      });

      // Refresh rating info
      await fetchRatingInfo();

      // Notify parent component if callback exists
      if (onRatingUpdate) {
        onRatingUpdate();
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to submit rating",
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (interactive = false, displayRating = null) => {
    const stars = [];
    const rating = interactive
      ? hoveredStar || ratingInfo?.userRating || 0
      : displayRating || ratingInfo?.averageRating || 0;

    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.floor(rating);
      const isHalfFilled =
        !interactive && i - 0.5 <= rating && i > Math.floor(rating);

      stars.push(
        <button
          key={i}
          type="button"
          disabled={!interactive || submitting || !ratingInfo?.canUserRate}
          onMouseEnter={() => interactive && setHoveredStar(i)}
          onMouseLeave={() => interactive && setHoveredStar(0)}
          onClick={() => interactive && handleRating(i)}
          className={`transition-all ${
            interactive && ratingInfo?.canUserRate
              ? "cursor-pointer hover:scale-110 active:scale-95"
              : "cursor-default"
          } ${submitting ? "opacity-50" : ""}`}
          aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              isFilled
                ? "fill-yellow-400 text-yellow-400"
                : isHalfFilled
                ? "fill-yellow-200 text-yellow-400"
                : interactive && hoveredStar >= i
                ? "fill-yellow-200 text-yellow-400"
                : "fill-none text-gray-300"
            }`}
          />
        </button>
      );
    }

    return stars;
  };

  const renderRatingDistribution = () => {
    if (!ratingInfo?.ratingDistribution) return null;

    const total = ratingInfo.totalRatings;
    if (total === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No ratings yet. Be the first to rate!
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingInfo.ratingDistribution[star] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm font-medium text-gray-700">
                  {star}
                </span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-yellow-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-2 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Message Toast */}
      {message && (
        <div
          className={`mx-6 mt-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <AlertCircle
            className={`w-5 h-5 flex-shrink-0 ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          />
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-800" : "text-red-800"
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Customer Reviews & Ratings
        </h3>

        {/* Average Rating Display */}
        <div className="flex flex-col md:flex-row gap-6 pb-6 border-b border-gray-200">
          {/* Rating Summary */}
          <div className="flex flex-col items-center md:items-start">
            <div className="text-5xl font-bold text-gray-900">
              {ratingInfo?.averageRating?.toFixed(1) || "0.0"}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {renderStars(false)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {ratingInfo?.totalRatings || 0}{" "}
              {ratingInfo?.totalRatings === 1 ? "review" : "reviews"}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1">{renderRatingDistribution()}</div>
        </div>

        {/* User Rating Section */}
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">
            {ratingInfo?.hasUserRated ? "Your Rating" : "Rate this product"}
          </h4>

          {ratingInfo?.canUserRate ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {renderStars(true)}
                </div>
                {ratingInfo?.hasUserRated && (
                  <span className="text-sm text-gray-500 ml-2">
                    (Click to change your rating)
                  </span>
                )}
              </div>
              {hoveredStar > 0 && (
                <p className="text-sm text-gray-600">
                  Click to rate {hoveredStar} star{hoveredStar > 1 ? "s" : ""}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <ShoppingBag className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Purchase Required
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  You need to purchase and receive this product before you can
                  rate it. This helps ensure authentic reviews from verified
                  buyers.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User's Current Rating (if exists) */}
        {ratingInfo?.hasUserRated && ratingInfo?.userRating && (
          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-purple-900">
                Your current rating:
              </span>
              <div className="flex items-center gap-1">
                {renderStars(false, ratingInfo.userRating)}
              </div>
              <span className="text-sm font-semibold text-purple-900">
                {ratingInfo.userRating}/5
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductRating;
