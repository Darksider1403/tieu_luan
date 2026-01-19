import { useState, useEffect } from "react";
import { MessageCircle, ThumbsUp, Edit2, Trash2, Reply } from "lucide-react";
import { commentService } from "../services/commentService";
import Toast from "./Toast";

// Move CommentItem outside to prevent re-creation on every render
const CommentItem = ({
  comment,
  isReply = false,
  replyTo,
  replyText,
  setReplyTo,
  setReplyText,
  editingComment,
  editText,
  setEditingComment,
  setEditText,
  isSubmitting,
  isLoggedIn,
  handleReply,
  handleEdit,
  handleDelete,
  handleHelpful,
  formatDate,
  showToast,
}) => (
  <div className={`${isReply ? "ml-12 mt-4" : ""}`}>
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {comment.userName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-900">
              {comment.userName}
            </span>
            {comment.isVerifiedPurchase && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                ✓ Đã mua hàng
              </span>
            )}
            <span className="text-xs text-gray-500">
              {formatDate(comment.createdAt)}
            </span>
          </div>

          {/* Edit Mode */}
          {editingComment === comment.id ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Chỉnh sửa bình luận... (tối thiểu 5 ký tự)"
              />
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs text-gray-500">
                  {editText.trim().length < 5
                    ? `Còn thiếu ${5 - editText.trim().length} ký tự`
                    : "✓ Đủ ký tự"}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(comment.id)}
                    disabled={isSubmitting || editText.trim().length < 5}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isSubmitting ? "Đang lưu..." : "Lưu"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditText("");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">
              {comment.comment}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-2 text-sm">
          <button
            onClick={() =>
              handleHelpful(comment.id, comment.isHelpfulByCurrentUser)
            }
            disabled={!isLoggedIn}
            className={`flex items-center gap-1 ${
              comment.isHelpfulByCurrentUser
                ? "text-blue-600 font-medium"
                : "text-gray-600 hover:text-blue-600"
            } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsUp
              size={16}
              className={comment.isHelpfulByCurrentUser ? "fill-current" : ""}
            />
            <span>Hữu ích ({comment.helpfulCount})</span>
          </button>

          {!isReply && (
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  showToast("Vui lòng đăng nhập để trả lời", "error");
                  return;
                }
                setReplyTo(comment.id);
              }}
              className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Reply size={16} />
              <span>Trả lời</span>
            </button>
          )}

          {comment.canEdit && (
            <button
              onClick={() => {
                setEditingComment(comment.id);
                setEditText(comment.comment);
              }}
              className="flex items-center gap-1 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <Edit2 size={16} />
              <span>Sửa</span>
            </button>
          )}

          {comment.canDelete && (
            <button
              onClick={() => handleDelete(comment.id)}
              className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
            >
              <Trash2 size={16} />
              <span>Xóa</span>
            </button>
          )}
        </div>

        {/* Reply Form */}
        {replyTo === comment.id && (
          <div className="mt-4">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Viết câu trả lời... (tối thiểu 5 ký tự)"
            />
            <div className="flex justify-between items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">
                {replyText.trim().length < 5
                  ? `Còn thiếu ${5 - replyText.trim().length} ký tự`
                  : "✓ Đủ ký tự"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReply(comment.id)}
                  disabled={isSubmitting || replyText.trim().length < 5}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi"}
                </button>
                <button
                  onClick={() => {
                    setReplyTo(null);
                    setReplyText("");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                isReply={true}
                replyTo={replyTo}
                replyText={replyText}
                setReplyTo={setReplyTo}
                setReplyText={setReplyText}
                editingComment={editingComment}
                editText={editText}
                setEditingComment={setEditingComment}
                setEditText={setEditText}
                isSubmitting={isSubmitting}
                isLoggedIn={isLoggedIn}
                handleReply={handleReply}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleHelpful={handleHelpful}
                formatDate={formatDate}
                showToast={showToast}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

function ProductComments({ productId }) {
  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    loadComments();
  }, [productId, page]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentService.getProductComments(productId, page, 20);
      setComments(data.comments || []);
      setTotalComments(data.totalComments || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error loading comments:", error);
      showToast("Không thể tải bình luận", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      showToast("Vui lòng đăng nhập để bình luận", "error");
      return;
    }

    // Validation is now handled by button disabled state and visual feedback
    if (newComment.trim().length < 5) {
      return;
    }

    try {
      setIsSubmitting(true);
      await commentService.createComment(productId, newComment.trim());
      setNewComment("");
      showToast("Đã thêm bình luận thành công!");
      loadComments();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể thêm bình luận",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId) => {
    if (!isLoggedIn) {
      showToast("Vui lòng đăng nhập để trả lời", "error");
      return;
    }

    // Validation is now handled by button disabled state and visual feedback
    if (replyText.trim().length < 5) {
      return;
    }

    try {
      setIsSubmitting(true);
      await commentService.createComment(productId, replyText.trim(), parentId);
      setReplyTo(null);
      setReplyText("");
      showToast("Đã trả lời bình luận!");
      loadComments();
    } catch (error) {
      showToast("Không thể trả lời bình luận", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId) => {
    // Validation is now handled by button disabled state and visual feedback
    if (editText.trim().length < 5) {
      return;
    }

    try {
      setIsSubmitting(true);
      await commentService.updateComment(commentId, editText.trim());
      setEditingComment(null);
      setEditText("");
      showToast("Đã cập nhật bình luận!");
      loadComments();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể cập nhật bình luận",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
      return;
    }

    try {
      await commentService.deleteComment(commentId);
      showToast("Đã xóa bình luận!");
      loadComments();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không thể xóa bình luận",
        "error"
      );
    }
  };

  const handleHelpful = async (commentId, isHelpful) => {
    if (!isLoggedIn) {
      showToast("Vui lòng đăng nhập để đánh dấu hữu ích", "error");
      return;
    }

    try {
      if (isHelpful) {
        await commentService.unmarkAsHelpful(commentId);
      } else {
        await commentService.markAsHelpful(commentId);
      }
      loadComments();
    } catch (error) {
      console.error("Error marking helpful:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="text-blue-600" size={24} />
        <h2 className="text-2xl font-bold text-gray-900">
          Bình luận ({totalComments})
        </h2>
      </div>

      {/* Comment Form */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows="4"
            placeholder="Viết bình luận của bạn... (tối thiểu 5 ký tự)"
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-gray-600">
              {newComment.length}/1000 ký tự
              {newComment.trim().length > 0 && newComment.trim().length < 5 && (
                <span className="text-red-500 ml-2">
                  (Còn thiếu {5 - newComment.trim().length} ký tự)
                </span>
              )}
              {newComment.trim().length >= 5 && (
                <span className="text-green-600 ml-2">✓</span>
              )}
            </span>
            <button
              type="submit"
              disabled={isSubmitting || newComment.trim().length < 5}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">
            Vui lòng{" "}
            <a
              href="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              đăng nhập
            </a>{" "}
            để bình luận
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải bình luận...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 text-lg">
            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replyTo={replyTo}
                replyText={replyText}
                setReplyTo={setReplyTo}
                setReplyText={setReplyText}
                editingComment={editingComment}
                editText={editText}
                setEditingComment={setEditingComment}
                setEditText={setEditText}
                isSubmitting={isSubmitting}
                isLoggedIn={isLoggedIn}
                handleReply={handleReply}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleHelpful={handleHelpful}
                formatDate={formatDate}
                showToast={showToast}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trang trước
              </button>
              <span className="px-4 py-2 text-gray-700">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trang sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProductComments;
