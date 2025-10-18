// Gallery image storage using localStorage

export type GalleryImage = {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
};

const GALLERY_KEY = 'image_gallery';

export const galleryStorage = {
  // Get all images from gallery
  getAll(): GalleryImage[] {
    try {
      const stored = localStorage.getItem(GALLERY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading gallery:', e);
      return [];
    }
  },

  // Add a new image to gallery
  add(name: string, dataUrl: string): GalleryImage {
    const images = this.getAll();
    const newImage: GalleryImage = {
      id: crypto.randomUUID(),
      name,
      dataUrl,
      createdAt: new Date().toISOString()
    };
    images.push(newImage);
    localStorage.setItem(GALLERY_KEY, JSON.stringify(images));
    return newImage;
  },

  // Delete an image from gallery
  delete(id: string): void {
    const images = this.getAll().filter(img => img.id !== id);
    localStorage.setItem(GALLERY_KEY, JSON.stringify(images));
  },

  // Search images by name
  search(query: string): GalleryImage[] {
    const images = this.getAll();
    if (!query.trim()) return images;
    const lowerQuery = query.toLowerCase();
    return images.filter(img => img.name.toLowerCase().includes(lowerQuery));
  },

  // Update image name
  updateName(id: string, newName: string): void {
    const images = this.getAll();
    const image = images.find(img => img.id === id);
    if (image) {
      image.name = newName;
      localStorage.setItem(GALLERY_KEY, JSON.stringify(images));
    }
  }
};
