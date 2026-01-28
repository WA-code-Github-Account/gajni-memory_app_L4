import { useState, useEffect } from "react";
import supabase from "../lib/supabase";

const useMemories = (user) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Storage key based on user
  const getStorageKey = () => {
    if (user?.id) {
      return `gajni-memories-${user.id}`;
    } else if (user?.user_metadata?.sub) {
      return `gajni-memories-${user.user_metadata.sub}`;
    }
    return 'gajni-memories';
  };

  // Save to localStorage as backup
  const saveToLocalStorage = (memoriesData) => {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(memoriesData));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  };

  // ---------- LOAD MEMORIES ----------
  useEffect(() => {
    // Load from localStorage first for immediate UI
    try {
      const storageKey = getStorageKey();
      const savedMemories = localStorage.getItem(storageKey);
      if (savedMemories) {
        const parsedMemories = JSON.parse(savedMemories);
        setMemories(parsedMemories);
      }
    } catch (error) {
      console.error("Failed to load from localStorage", error);
    }

    if (!user?.id) {
      setLoading(false);
      return;
    }

    const loadMemories = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("memories_v2")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ LOAD ERROR:", error);
          console.error("Error details:", error.message);
        } else {
          const formatted = data.map((item) => ({
            id: item.id,
            title: item.title || "",
            description: item.content || "",
            timestamp: new Date(item.created_at).getTime(),
            completed: item.is_favorite || false,
          }));

          setMemories(formatted);
          saveToLocalStorage(formatted); // Backup to localStorage
          console.log("✅ Loaded", formatted.length, "memories from Supabase");
        }
      } catch (err) {
        console.error("❌ Unexpected error loading memories:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMemories();
  }, [user]);

  // ---------- ADD MEMORY ----------
  const addMemory = async ({ title, description }) => {
    if (!user?.id) {
      console.warn("❌ User ID missing. Cannot add memory.");
      return;
    }

    const payload = {
      title: title || "",
      content: description || "",
      is_favorite: false,
      user_id: user.id,
    };

    console.log("📝 Adding memory to Supabase...", payload);

    // Create temporary memory for immediate UI update
    const tempMemory = {
      id: `local_${Date.now()}`,
      title: payload.title,
      description: payload.content,
      timestamp: Date.now(),
      completed: false,
    };

    // Optimistically update UI
    setMemories((prev) => [tempMemory, ...prev]);

    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from("memories_v2")
        .insert([payload])
        .select();

      if (error) {
        console.error("❌ INSERT ERROR:", error);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        
        // Keep the temporary memory in UI but save to localStorage
        saveToLocalStorage([tempMemory, ...memories]);
        alert("Failed to save to database. Saved locally instead.");
      } else {
        console.log("✅ Memory saved to Supabase successfully!");
        
        // Replace temp memory with actual DB record
        const actualMemory = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].content,
          timestamp: new Date(data[0].created_at).getTime(),
          completed: data[0].is_favorite,
        };

        setMemories((prev) =>
          prev.map((m) => (m.id === tempMemory.id ? actualMemory : m))
        );

        // Save to localStorage as backup
        saveToLocalStorage([actualMemory, ...memories.filter(m => m.id !== tempMemory.id)]);
      }
    } catch (err) {
      console.error("❌ Unexpected error adding memory:", err);
      saveToLocalStorage([tempMemory, ...memories]);
    }
  };

  // ---------- UPDATE MEMORY ----------
  const updateMemory = async (id, updates) => {
    if (!user?.id) return;

    // Optimistically update UI
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );

    // Save to localStorage immediately
    const updatedMemories = memories.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    saveToLocalStorage(updatedMemories);

    try {
      const { error } = await supabase
        .from("memories_v2")
        .update({
          title: updates.title,
          content: updates.description,
          is_favorite: updates.completed,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("❌ UPDATE ERROR:", error);
        console.error("Error message:", error.message);
      } else {
        console.log("✅ Memory updated successfully!");
      }
    } catch (err) {
      console.error("❌ Unexpected error updating memory:", err);
    }
  };

  // ---------- DELETE MEMORY ----------
  const deleteMemory = async (id) => {
    if (!user?.id) return;

    // Optimistically update UI
    setMemories((prev) => prev.filter((m) => m.id !== id));

    // Save to localStorage immediately
    const updatedMemories = memories.filter((m) => m.id !== id);
    saveToLocalStorage(updatedMemories);

    try {
      const { error } = await supabase
        .from("memories_v2")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("❌ DELETE ERROR:", error);
        console.error("Error message:", error.message);
      } else {
        console.log("✅ Memory deleted successfully!");
      }
    } catch (err) {
      console.error("❌ Unexpected error deleting memory:", err);
    }
  };

  return {
    memories,
    loading,
    addMemory,
    updateMemory,
    deleteMemory,
  };
};

export default useMemories;