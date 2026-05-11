import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import axios from "axios";
import { Skeleton } from "../ui/skeleton";

function ProductImageUpload({
  imageFile,
  setImageFile,
  imageLoadingState,
  uploadedImageUrl,
  setUploadedImageUrl,
  setImageLoadingState,
  isEditMode,
  isCustomStyling = false,
}) {
  const inputRef = useRef(null);

  function handleImageFileChange(event) {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) setImageFile(selectedFile);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDrop(event) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) setImageFile(droppedFile);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setUploadedImageUrl(""); // Clear URL on remove
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function uploadImageToCloudinary() {
    setImageLoadingState(true);
    try {
      const data = new FormData();
      data.append("my_file", imageFile);
      const response = await axios.post(
        "http://localhost:5000/api/admin/products/upload-image",
        data,
        { withCredentials: true }
      );

      if (response?.data?.success) {
        setUploadedImageUrl(response.data.result.url);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setImageLoadingState(false);
    }
  }

  useEffect(() => {
    if (imageFile !== null) uploadImageToCloudinary();
  }, [imageFile]);

  return (
    <div className={`w-full mt-4 ${isCustomStyling ? "" : "max-w-md mx-auto"}`}>
      <Label className="text-lg font-semibold mb-2 block">Product Image</Label>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 transition-all ${
          isEditMode ? "opacity-60 cursor-not-allowed" : "hover:border-primary/50"
        } ${imageFile ? "border-primary bg-primary/5" : "border-muted-foreground/30"}`}
      >
        <Input
          id="image-upload"
          type="file"
          className="hidden"
          ref={inputRef}
          onChange={handleImageFileChange}
          disabled={isEditMode}
        />
        
        {!imageFile ? (
          <Label
            htmlFor="image-upload"
            className={`${
              isEditMode ? "cursor-not-allowed" : "cursor-pointer"
            } flex flex-col items-center justify-center h-40`}
          >
            <UploadCloudIcon className="w-10 h-10 text-muted-foreground mb-2" />
            <span className="text-sm font-medium">Drag & drop or click to upload</span>
            <span className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG up to 5MB</span>
          </Label>
        ) : imageLoadingState ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full bg-gray-200" />
            <p className="text-center text-sm text-muted-foreground animate-pulse">Uploading to cloud...</p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* IMAGE PREVIEW */}
              <div className="h-16 w-16 rounded-md overflow-hidden border bg-white flex-shrink-0">
                <img 
                  src={uploadedImageUrl || URL.createObjectURL(imageFile)} 
                  alt="Preview" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold max-w-[150px] truncate">
                  {imageFile.name}
                </p>
                <p className="text-xs text-green-600 font-medium">Upload Successful</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full hover:bg-destructive hover:text-white transition-colors"
              onClick={handleRemoveImage}
            >
              <XIcon className="w-4 h-4" />
              <span className="sr-only">Remove File</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductImageUpload;
