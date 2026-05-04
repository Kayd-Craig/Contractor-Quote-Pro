import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  quoteId: string;
  photos: string[];
  onAdd: (uri: string) => void;
  onRemove: (uri: string) => void;
}

const THUMB_SIZE = (Dimensions.get("window").width - 32 - 32 - 8) / 3;

export function PhotosSection({ quoteId, photos, onAdd, onRemove }: Props) {
  const colors = useColors();
  const [preview, setPreview] = useState<string | null>(null);

  async function handlePickImage(source: "camera" | "library") {
    if (Platform.OS !== "web") {
      const perm =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (perm.status !== "granted") {
        Alert.alert(
          "Permission needed",
          source === "camera"
            ? "Camera access is needed to take job-site photos."
            : "Photo library access is needed to attach photos."
        );
        return;
      }
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: "images",
            quality: 0.75,
            allowsEditing: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            quality: 0.75,
            allowsMultipleSelection: true,
            selectionLimit: 10,
          });

    if (!result.canceled) {
      for (const asset of result.assets) {
        onAdd(asset.uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }

  function handleShowOptions() {
    if (Platform.OS === "web") {
      handlePickImage("library");
      return;
    }
    Alert.alert("Add Photo", "Choose a source:", [
      { text: "Take Photo", onPress: () => handlePickImage("camera") },
      { text: "Choose from Library", onPress: () => handlePickImage("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function handleDeletePhoto(uri: string) {
    const doRemove = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onRemove(uri);
    };

    if (Platform.OS === "web") {
      if (window.confirm("Remove this photo from the quote?")) {
        doRemove();
      }
    } else {
      Alert.alert("Remove Photo", "Remove this photo from the quote?", [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: doRemove },
      ]);
    }
  }

  return (
    <View>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <Feather name="camera" size={15} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Job-Site Photos
          </Text>
          {photos.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.countText, { color: colors.primary }]}>
                {photos.length}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { borderColor: colors.primary, backgroundColor: colors.primary + "12" }]}
          onPress={handleShowOptions}
        >
          <Feather name="plus" size={14} color={colors.primary} />
          <Text style={[styles.addBtnText, { color: colors.primary }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <TouchableOpacity
          style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleShowOptions}
          activeOpacity={0.7}
        >
          <Feather name="camera" size={22} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Tap to add job-site photos
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            Photos are included with the quote
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.grid, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {photos.map((uri) => (
            <TouchableOpacity
              key={uri}
              onPress={() => setPreview(uri)}
              onLongPress={() => handleDeletePhoto(uri)}
              activeOpacity={0.85}
              style={styles.thumb}
            >
              <Image
                source={{ uri }}
                style={styles.thumbImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: "rgba(0,0,0,0.55)" }]}
                onPress={() => handleDeletePhoto(uri)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Feather name="x" size={11} color="#FFFFFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.thumb, styles.addThumb, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={handleShowOptions}
          >
            <Feather name="plus" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}

      {/* Full-screen preview */}
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPreview(null)} />
          {preview && (
            <Image
              source={{ uri: preview }}
              style={styles.previewImage}
              contentFit="contain"
            />
          )}
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreview(null)}>
            <Feather name="x" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 4,
  },
  sectionLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  countBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  emptySubtext: { fontSize: 12, fontFamily: "Inter_400Regular" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  deleteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addThumb: {
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "80%",
  },
  previewClose: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
