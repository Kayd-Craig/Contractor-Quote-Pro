import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

export interface NearbyStore {
  id: string;
  name: string;
  color: string;
  textColor: string;
  category: string;
  description: string;
  websiteUrl: string;
  storeFinderUrl: (zip: string) => string;
}

export const NEARBY_STORES: NearbyStore[] = [
  {
    id: "homedepot",
    name: "Home Depot",
    color: "#F96302",
    textColor: "#FFFFFF",
    category: "Home Improvement",
    description: "Lumber, flooring, plumbing, electrical, paint & more",
    websiteUrl: "https://www.homedepot.com",
    storeFinderUrl: (zip) =>
      `https://www.homedepot.com/l/store/search?zipCode=${zip}`,
  },
  {
    id: "lowes",
    name: "Lowe's",
    color: "#004990",
    textColor: "#FFFFFF",
    category: "Home Improvement",
    description: "Building materials, appliances, tools & outdoor living",
    websiteUrl: "https://www.lowes.com",
    storeFinderUrl: (zip) => `https://www.lowes.com/store/?zipCode=${zip}`,
  },
  {
    id: "amazon",
    name: "Amazon",
    color: "#FF9900",
    textColor: "#131A22",
    category: "Online Marketplace",
    description: "Tools, hardware & jobsite supplies — fast Prime delivery",
    websiteUrl: "https://www.amazon.com",
    storeFinderUrl: () =>
      `https://www.amazon.com/s?k=construction+tools&i=tools`,
  },
  {
    id: "acehardware",
    name: "Ace Hardware",
    color: "#E51937",
    textColor: "#FFFFFF",
    category: "Hardware",
    description: "Hardware, tools, paint, lawn & garden supplies",
    websiteUrl: "https://www.acehardware.com",
    storeFinderUrl: (zip) =>
      `https://www.acehardware.com/store-finder?q=${zip}`,
  },
  {
    id: "truevalue",
    name: "True Value",
    color: "#00783E",
    textColor: "#FFFFFF",
    category: "Hardware",
    description: "Hardware, paint, plumbing, electrical & farm supplies",
    websiteUrl: "https://www.truevalue.com",
    storeFinderUrl: (zip) =>
      `https://www.truevalue.com/en-us/store-finder?query=${zip}`,
  },
  {
    id: "menards",
    name: "Menards",
    color: "#0A6E27",
    textColor: "#FFFFFF",
    category: "Home Improvement",
    description: "Building materials, lumber, tools & farm products",
    websiteUrl: "https://www.menards.com",
    storeFinderUrl: (zip) =>
      `https://www.menards.com/main/store-finder.html?zip=${zip}`,
  },
  {
    id: "84lumber",
    name: "84 Lumber",
    color: "#FFAA00",
    textColor: "#1A1A2E",
    category: "Lumber & Building",
    description: "Lumber, millwork, windows, doors & roofing",
    websiteUrl: "https://www.84lumber.com",
    storeFinderUrl: (zip) =>
      `https://www.84lumber.com/store-finder/?zip=${zip}`,
  },
  {
    id: "doitbest",
    name: "Do it Best",
    color: "#003594",
    textColor: "#FFFFFF",
    category: "Hardware",
    description: "Hardware, building materials & contractor supplies",
    websiteUrl: "https://www.doitbest.com",
    storeFinderUrl: (zip) =>
      `https://www.doitbest.com/pages/store-finder?zip=${zip}`,
  },
  {
    id: "fastenal",
    name: "Fastenal",
    color: "#0055A5",
    textColor: "#FFFFFF",
    category: "Fasteners & Industrial",
    description: "Fasteners, tools, safety gear & industrial supplies",
    websiteUrl: "https://www.fastenal.com",
    storeFinderUrl: (zip) =>
      `https://www.fastenal.com/locations?zip=${zip}`,
  },
  {
    id: "harborfreight",
    name: "Harbor Freight Tools",
    color: "#D32F2F",
    textColor: "#FFFFFF",
    category: "Tools",
    description: "Affordable tools, equipment & accessories",
    websiteUrl: "https://www.harborfreight.com",
    storeFinderUrl: (zip) =>
      `https://www.harborfreight.com/store-finder.html?zip=${zip}`,
  },
  {
    id: "sutherlands",
    name: "Sutherlands",
    color: "#215732",
    textColor: "#FFFFFF",
    category: "Lumber & Building",
    description: "Lumber, building materials & farm supplies",
    websiteUrl: "https://www.sutherlands.com",
    storeFinderUrl: (zip) =>
      `https://www.sutherlands.com/storelocator?zipcode=${zip}`,
  },
];

interface Props {
  store: NearbyStore;
  zipCode: string;
}

export function StoreNearMeCard({ store, zipCode }: Props) {
  const colors = useColors();

  function openStoreFinder() {
    const url = zipCode
      ? store.storeFinderUrl(zipCode)
      : store.websiteUrl;
    Linking.openURL(url);
  }

  function openWebsite() {
    Linking.openURL(store.websiteUrl);
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Store badge + name */}
      <View style={styles.top}>
        <View style={[styles.badge, { backgroundColor: store.color }]}>
          <Text style={[styles.badgeText, { color: store.textColor }]}>
            {store.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 3)}
          </Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={[styles.storeName, { color: colors.foreground }]}>
            {store.name}
          </Text>
          <View
            style={[
              styles.categoryTag,
              { backgroundColor: store.color + "18" },
            ]}
          >
            <Text style={[styles.categoryText, { color: store.color }]}>
              {store.category}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        {store.description}
      </Text>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[
            styles.findBtn,
            { backgroundColor: store.color },
          ]}
          onPress={openStoreFinder}
          activeOpacity={0.85}
        >
          <Feather name="map-pin" size={13} color={store.textColor} />
          <Text style={[styles.findBtnText, { color: store.textColor }]}>
            {zipCode ? `Find Near ${zipCode}` : "Find a Store"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.webBtn,
            { borderColor: colors.border, backgroundColor: colors.secondary },
          ]}
          onPress={openWebsite}
          activeOpacity={0.8}
        >
          <Feather name="external-link" size={13} color={colors.mutedForeground} />
          <Text style={[styles.webBtnText, { color: colors.mutedForeground }]}>
            Shop Online
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  nameBlock: {
    flex: 1,
    gap: 4,
  },
  storeName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  findBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  findBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  webBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  webBtnText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
