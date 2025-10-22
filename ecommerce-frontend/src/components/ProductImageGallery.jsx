import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function ProductImageGallery({ images, productName }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef(null);

  const imageArray = Object.values(images).filter((img) => img);

  // Auto-advance slides every 5 seconds (only if not zoomed)
  useEffect(() => {
    if (imageArray.length === 0 || isZoomed) return;

    const interval = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % imageArray.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [imageArray.length, isZoomed]);

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? imageArray.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev + 1) % imageArray.length);
  };

  const handleMouseMove = (e) => {
    if (!isZoomed || !imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({
      x: Math.min(Math.max(x, 0), 100),
      y: Math.min(Math.max(y, 0), 100),
    });
  };

  const handleMouseEnter = () => {
    console.log("Mouse entered image");
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    console.log("Mouse left image");
    setIsZoomed(false);
    setMousePosition({ x: 50, y: 50 });
  };

  if (imageArray.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Không có hình ảnh</p>
      </div>
    );
  }

  const currentImage = imageArray[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main Image with Zoom */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden group">
        <div
          ref={imageContainerRef}
          className="relative h-96 bg-gray-50 overflow-hidden flex items-center justify-center"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isZoomed ? "grab" : "zoom-in" }}
        >
          <img
            src={currentImage}
            alt={productName}
            className="w-full h-full object-contain transition-transform duration-200"
            style={{
              transform: isZoomed ? "scale(2)" : "scale(1)",
              transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
            }}
          />

          {/* Zoom Indicator */}
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded text-sm font-medium pointer-events-none">
            {isZoomed ? "Di chuột để xem chi tiết" : "Hover để phóng to"}
          </div>
        </div>

        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Next Button */}
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
        >
          <ChevronRight size={24} />
        </button>

        {/* Image Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded text-sm pointer-events-none">
          {selectedIndex + 1} / {imageArray.length}
        </div>
      </div>

      {/* Thumbnail Slider */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {imageArray.map((img, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={`flex-shrink-0 w-20 h-20 rounded border-2 transition-all overflow-hidden ${
              selectedIndex === index
                ? "border-blue-500 ring-2 ring-blue-300"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <img
              src={img}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Indicator Dots */}
      <div className="flex justify-center gap-2">
        {imageArray.map((_, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              selectedIndex === index ? "bg-blue-600 w-6" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
export default ProductImageGallery;
