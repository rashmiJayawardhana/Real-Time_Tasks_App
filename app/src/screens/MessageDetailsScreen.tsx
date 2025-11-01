// app/src/screens/MessageDetailsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type Props = StackScreenProps<RootStackParamList, 'MessageDetails'>;

export default function MessageDetailsScreen({ navigation, route }: Props) {
  const { message } = route.params;
  const [copied, setCopied] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  const handleCopyText = async () => {
    try {
        await Clipboard.setStringAsync(message.text);
        setCopied(true);
      
      // Animate the checkmark
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setCopied(false));
    } catch (error) {
      Alert.alert('Error', 'Failed to copy text');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${message.user_name}: ${message.text}\n\nSent ${getRelativeTime(message.created_at)}`,
        title: 'Share Message',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share message');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Delete functionality requires backend implementation');
            // TODO: Implement delete API call
            navigation.goBack();
          },
        },
      ]
    );
  };

  const getAvatarColor = (id: number) => {
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', 
      '#10b981', '#06b6d4', '#6366f1', '#14b8a6'
    ];
    return colors[id % colors.length];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const wordCount = message.text.trim().split(/\s+/).length;
  const charCount = message.text.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(message.user_id) }]}>
            <Text style={styles.avatarText}>{getInitials(message.user_name)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{message.user_name}</Text>
            <Text style={styles.userMeta}>User ID: {message.user_id}</Text>
          </View>
        </View>

        {/* Message Content Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message Content</Text>
          <View style={styles.messageCard}>
            <ScrollView 
              style={styles.messageScrollView}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.messageText} selectable>
                {message.text}
              </Text>
            </ScrollView>
          </View>
        </View>

        {/* Statistics Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{charCount}</Text>
              <Text style={styles.statLabel}>Characters</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{wordCount}</Text>
              <Text style={styles.statLabel}>Words</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{message.id}</Text>
              <Text style={styles.statLabel}>Message ID</Text>
            </View>
          </View>
        </View>

        {/* Timestamp Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timestamp</Text>
          <View style={styles.timestampCard}>
            <View style={styles.timestampRow}>
              <Text style={styles.timestampIcon}>🕐</Text>
              <View style={styles.timestampInfo}>
                <Text style={styles.timestampLabel}>Sent</Text>
                <Text style={styles.timestampValue}>
                  {getRelativeTime(message.created_at)}
                </Text>
              </View>
            </View>
            
            <View style={styles.timestampDivider} />
            
            <View style={styles.timestampRow}>
              <Text style={styles.timestampIcon}>📅</Text>
              <View style={styles.timestampInfo}>
                <Text style={styles.timestampLabel}>Date</Text>
                <Text style={styles.timestampValue}>
                  {formatDate(message.created_at)}
                </Text>
              </View>
            </View>
            
            <View style={styles.timestampDivider} />
            
            <View style={styles.timestampRow}>
              <Text style={styles.timestampIcon}>⏰</Text>
              <View style={styles.timestampInfo}>
                <Text style={styles.timestampLabel}>Time</Text>
                <Text style={styles.timestampValue}>
                  {formatTime(message.created_at)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <View style={styles.actionButtons}>
            {/* Copy Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCopyText}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.actionIconText}>📋</Text>
              </View>
              <Text style={styles.actionText}>Copy Text</Text>
              {copied && (
                <Animated.View 
                  style={[
                    styles.copiedBadge,
                    { opacity: fadeAnim }
                  ]}
                >
                  <Text style={styles.copiedText}>✓</Text>
                </Animated.View>
              )}
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
                <Text style={styles.actionIconText}>📤</Text>
              </View>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.actionIconText}>🗑️</Text>
              </View>
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Message created on {formatDate(message.created_at)}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  messageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    maxHeight: 300,
  },
  messageScrollView: {
    maxHeight: 260,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  timestampCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestampIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  timestampInfo: {
    flex: 1,
  },
  timestampLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  timestampValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  timestampDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  actionsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconText: {
    fontSize: 28,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  copiedBadge: {
    position: 'absolute',
    top: 0,
    right: 8,
    backgroundColor: '#10b981',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copiedText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
});