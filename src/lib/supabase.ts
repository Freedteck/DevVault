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

export async function getAllProfiles() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

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

export async function getExistingConversation(accountId1, accountId2) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(
      `and(participant_1.eq.${accountId1},participant_2.eq.${accountId2}),and(participant_1.eq.${accountId2},participant_2.eq.${accountId1})`
    )
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking conversation:", error);
    return null;
  }

  return data;
}

// 2. Create new conversation
export async function createConversation(
  hederaTopicId,
  accountId1,
  accountId2
) {
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      hedera_topic_id: hederaTopicId,
      participant_1: accountId1,
      participant_2: accountId2,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return null;
  }

  return data;
}

// 3. Get all conversations for a user
export async function getUserConversations(accountId) {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      conversation_id,
      hedera_topic_id,
      participant_1,
      participant_2,
      created_at
    `
    )
    .or(`participant_1.eq.${accountId},participant_2.eq.${accountId}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }

  return data;
}

// 4. Get all conversations for a user with partner details
export async function getUserConversationsWithPartners(accountId) {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      conversation_id,
      hedera_topic_id,
      participant_1,
      participant_2,
      created_at,
      participant_1_profile:profiles!conversations_participant_1_fkey(
        account_id,
        full_name,
        profile_image_url
      ),
      participant_2_profile:profiles!conversations_participant_2_fkey(
        account_id,
        full_name,
        profile_image_url
      )
    `
    )
    .or(`participant_1.eq.${accountId},participant_2.eq.${accountId}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations with partners:", error);
    return [];
  }

  // Transform data to include partner info
  const conversations = data.map((conv) => {
    const isParticipant1 = conv.participant_1 === accountId;
    const partner = isParticipant1
      ? conv.participant_2_profile
      : conv.participant_1_profile;

    return {
      conversation_id: conv.conversation_id,
      hedera_topic_id: conv.hedera_topic_id,
      partner: partner,
      created_at: conv.created_at,
    };
  });

  return conversations;
}

// 5. Get conversation by Hedera topic ID
export async function getConversationByTopicId(hederaTopicId) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("hedera_topic_id", hederaTopicId)
    .single();

  if (error) {
    console.error("Error fetching conversation by topic:", error);
    return null;
  }

  return data;
}
