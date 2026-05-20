import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { storage, db } from "./firebase";
import { Collections } from "./firestore";
import type { Photo } from "@/types";

export async function uploadPhoto(
  file: File,
  userId: string,
  entityType: Photo["entityType"],
  entityId: string,
  caption = ""
): Promise<Photo> {
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const path = `photos/${userId}/${entityType}/${entityId}/${filename}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  const photoData = {
    entityType,
    entityId,
    userId,
    url,
    thumbnailUrl: url,
    filename,
    size: file.size,
    caption,
    storagePath: path,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, Collections.PHOTOS), photoData);
  return { id: docRef.id, ...photoData } as unknown as Photo;
}

export async function deletePhoto(photoId: string, storagePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch {
    // File may already be deleted
  }
}
