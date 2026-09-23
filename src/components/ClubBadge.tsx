import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Club } from '@/types';

interface ClubBadgeProps {
  club: Club;
  size?: number;
}

export function ClubBadge({ club, size = 32 }: ClubBadgeProps) {
  const [imageError, setImageError] = useState(false);
  const hasValidBadge = Boolean(club.badgeUrl) && !imageError;

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: hasValidBadge ? '#131417' : club.primaryColor,
        },
      ]}
    >
      {/* Chanfro de luz interior */}
      <View style={[styles.innerRing, { borderRadius: size / 2 }]} />

      {hasValidBadge ? (
        <Image
          source={{ uri: club.badgeUrl }}
          style={{ width: size * 0.76, height: size * 0.76 }}
          contentFit="contain"
          transition={200}
          onError={() => setImageError(true)}
        />
      ) : (
        <Text style={[styles.fallbackText, { fontSize: Math.max(size * 0.32, 9) }]}>
          {club.initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 3,
    elevation: 3,
  },
  innerRing: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  fallbackText: {
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});