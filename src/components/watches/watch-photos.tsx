"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { useToast } from "@/components/ui/toast";
import { apiDelete, apiPut } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export interface WatchImage {
  id: number;
  originalName: string;
  stage: string;
  caption?: string | null;
}

interface WatchPhotosProps {
  watchId: number;
  images: WatchImage[];
  primaryImageId?: number | null;
  /** Stage to tag new uploads with. */
  uploadStage: "before" | "after";
  onChange: () => void;
}

const ACCEPT = "image/jpeg,image/png,image/webp";

export function WatchPhotos({ watchId, images, primaryImageId, uploadStage, onChange }: WatchPhotosProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const cover = images.find((i) => i.id === primaryImageId) ?? images[0];
  const shown = images.find((i) => i.id === selectedId) ?? cover;

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => ACCEPT.split(",").includes(f.type));
    if (list.length === 0) {
      toast("Choose JPEG, PNG or WebP images", "error");
      return;
    }
    setUploading(list.length);
    let failed = 0;
    for (const file of list) {
      const body = new FormData();
      body.set("file", file);
      body.set("watchId", String(watchId));
      body.set("stage", uploadStage);
      const res = await fetch("/api/images", { method: "POST", body }).catch(() => null);
      if (!res?.ok) failed++;
      setUploading((n) => n - 1);
    }
    if (failed) toast(`${failed} photo${failed === 1 ? "" : "s"} couldn't be uploaded`, "error");
    else toast(`${list.length} photo${list.length === 1 ? "" : "s"} added`, "success");
    onChange();
  };

  const makeCover = async (id: number) => {
    try {
      await apiPut(`/api/watches/${watchId}`, { primaryImageId: id });
      onChange();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't set the cover photo", "error");
    }
  };

  const remove = async (id: number) => {
    try {
      await apiDelete(`/api/images/${id}`);
      if (selectedId === id) setSelectedId(null);
      onChange();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't delete the photo", "error");
    }
  };

  return (
    <Card className="p-0">
      <CardHeader className="flex-row items-center justify-between px-6 pt-5">
        <CardTitle>Photos {images.length > 0 && <span className="font-normal text-muted-foreground">({images.length})</span>}</CardTitle>
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading > 0}>
          {uploading > 0 ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {uploading > 0 ? `Uploading ${uploading}…` : "Add photos"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </CardHeader>

      <div
        className="p-4 pt-4"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
      >
        {images.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex h-44 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent/40",
              dragging && "border-ring bg-accent/60"
            )}
          >
            <ImagePlus className="size-6" aria-hidden />
            <span className="font-medium text-foreground">Drop photos here or click to choose</span>
            <span className="text-xs">JPEG, PNG or WebP, up to 15 MB each</span>
          </button>
        ) : (
          <div className={cn("flex flex-col gap-3 rounded-lg", dragging && "outline-2 outline-dashed outline-ring")}>
            {shown && (
              <div className="relative overflow-hidden rounded-lg bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element -- served by our own API route */}
                <img
                  src={`/api/images/${shown.id}`}
                  alt={shown.caption || shown.originalName}
                  className="aspect-[4/3] w-full object-cover outline-1 -outline-offset-1 outline-black/10"
                />
                <div className="absolute right-2 top-2 flex gap-2 rounded-lg bg-popover/90 p-1 shadow-raised backdrop-blur">
                  <IconButton
                    aria-label={shown.id === cover?.id ? "This is the cover photo" : "Use as cover photo"}
                    onClick={() => makeCover(shown.id)}
                    disabled={shown.id === cover?.id}
                  >
                    <Star className={cn(shown.id === cover?.id && "fill-current text-warning-ink")} />
                  </IconButton>
                  <IconButton aria-label="Delete photo" tone="destructive" onClick={() => remove(shown.id)}>
                    <Trash2 />
                  </IconButton>
                </div>
              </div>
            )}
            {images.length > 1 && (
              <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                {images.map((img) => (
                  <li key={img.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(img.id)}
                      aria-label={`Show ${img.originalName}`}
                      aria-pressed={img.id === shown?.id}
                      className={cn(
                        "block w-full overflow-hidden rounded-md outline-offset-2",
                        img.id === shown?.id ? "outline-2 outline-foreground" : "opacity-80 hover:opacity-100"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/images/${img.id}`}
                        alt=""
                        loading="lazy"
                        className="aspect-square w-full object-cover outline-1 -outline-offset-1 outline-black/10"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
