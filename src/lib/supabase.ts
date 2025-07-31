import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Profile Management Functions
export async function createProfile({
  accountId,
  fullName,
  bio = "",
  profileImageUrl = null,
}) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        account_id: accountId,
        full_name: fullName,
        bio: bio,
        profile_image_url: profileImageUrl,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getProfile(accountId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("account_id", accountId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAllProfiles(limit = 50, offset = 0) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateProfile(accountId, updates) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("account_id", accountId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteProfile(accountId) {
  try {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("account_id", accountId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Image Upload Functions
export async function uploadProfileImage(file, accountId) {
  try {
    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${accountId}_${Date.now()}.${fileExt}`;

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from("profile-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-images").getPublicUrl(fileName);

    return { success: true, url: publicUrl, path: data.path };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteProfileImage(imagePath) {
  try {
    const { error } = await supabase.storage
      .from("profile-images")
      .remove([imagePath]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function replaceProfileImage(
  newFile,
  accountId,
  oldImagePath = null
) {
  try {
    // Upload new image
    const uploadResult = await uploadProfileImage(newFile, accountId);
    if (!uploadResult.success) throw new Error(uploadResult.error);

    // Delete old image if provided
    if (oldImagePath) {
      await deleteProfileImage(oldImagePath);
    }

    return uploadResult;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Combined Functions
export async function createProfileWithImage(profileData, imageFile = null) {
  try {
    let profileImageUrl = null;

    // Upload image first if provided
    if (imageFile) {
      const imageResult = await uploadProfileImage(
        imageFile,
        profileData.accountId
      );
      if (!imageResult.success) throw new Error(imageResult.error);
      profileImageUrl = imageResult.url;
    }

    // Create profile with image URL
    const profileResult = await createProfile({
      ...profileData,
      profileImageUrl,
    });

    if (!profileResult.success) {
      // If profile creation fails and we uploaded an image, clean it up
      if (profileImageUrl) {
        const imagePath = profileImageUrl.split("/").pop();
        await deleteProfileImage(imagePath);
      }
      throw new Error(profileResult.error);
    }

    return profileResult;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateProfileWithImage(
  accountId,
  updates,
  newImageFile = null
) {
  try {
    let updatedData = { ...updates };

    // Handle image replacement if new image provided
    if (newImageFile) {
      // Get current profile to find old image
      const currentProfile = await getProfile(accountId);
      if (!currentProfile.success) throw new Error(currentProfile.error);

      const oldImageUrl = currentProfile.data.profile_image_url;
      const oldImagePath = oldImageUrl ? oldImageUrl.split("/").pop() : null;

      // Upload new image
      const imageResult = await replaceProfileImage(
        newImageFile,
        accountId,
        oldImagePath
      );
      if (!imageResult.success) throw new Error(imageResult.error);

      updatedData.profile_image_url = imageResult.url;
    }

    // Update profile
    const profileResult = await updateProfile(accountId, updatedData);
    return profileResult;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Utility Functions
export async function checkAccountExists(accountId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("account_id", accountId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return { success: true, exists: !!data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function searchProfiles(query, limit = 20) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .or(`full_name.ilike.%${query}%,bio.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
