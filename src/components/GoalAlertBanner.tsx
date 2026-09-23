import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GoalAlertBannerProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
}

export function GoalAlertBanner({ visible, title, message, onDismiss }: GoalAlertBannerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: insets.top + 10,
        useNativeDriver: true,
        bounciness: 8,
      }).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, insets.top]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={handleDismiss}>
        <View style={styles.iconBox}>
          <Text style={styles.goalIcon}>⚽</Text>
        </View>
        <View style={styles.textBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={18} color="#a1a1aa" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#16a34a',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalIcon: {
    fontSize: 20,
  },
  textBox: {
    flex: 1,
  },
  title: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  message: {
    color: '#f4f4f5',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
});