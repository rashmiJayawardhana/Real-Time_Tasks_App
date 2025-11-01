// app/src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setUser } from '../store/messagesSlice';
import { clearUser } from '../services/storage';
import { disconnectSocket } from '../services/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { user, messages } = useSelector((state: RootState) => state.messages);
  const dispatch = useDispatch();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearUser();
              disconnectSocket();
              dispatch(setUser(null as any));
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handleClearMessages = () => {
    Alert.alert(
      'Clear All Messages',
      'This will clear all messages from the server. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'This feature requires backend implementation');
          },
        },
      ]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Clear app cache and temporary data?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Keep user data but clear other cache
              await AsyncStorage.getAllKeys().then(keys => {
                const filtered = keys.filter(key => key !== 'user');
                return AsyncStorage.multiRemove(filtered);
              });
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    rightElement,
  }: any) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Text style={styles.settingIconText}>{icon}</Text>
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightElement || (showArrow && (
        <Text style={styles.settingArrow}>›</Text>
      ))}
    </TouchableOpacity>
  );

  const SettingSection = ({ title, children }: any) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileId}>User ID: {user?.id}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{messages.length}</Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {new Date().toLocaleDateString()}
              </Text>
              <Text style={styles.statLabel}>Joined</Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <SettingSection title="Preferences">
          <SettingItem
            icon="🔔"
            title="Notifications"
            subtitle="Get notified for new messages"
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            showArrow={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={notificationsEnabled ? '#3b82f6' : '#f3f4f6'}
              />
            }
          />
          <View style={styles.divider} />
          <SettingItem
            icon="🔊"
            title="Sound"
            subtitle="Play sound for notifications"
            onPress={() => setSoundEnabled(!soundEnabled)}
            showArrow={false}
            rightElement={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={soundEnabled ? '#3b82f6' : '#f3f4f6'}
              />
            }
          />
        </SettingSection>

        {/* Data & Storage Section */}
        <SettingSection title="Data & Storage">
          <SettingItem
            icon="🗑️"
            title="Clear Cache"
            subtitle="Free up storage space"
            onPress={handleClearCache}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="💬"
            title="Clear Messages"
            subtitle="Delete all messages from server"
            onPress={handleClearMessages}
          />
        </SettingSection>

        {/* About Section */}
        <SettingSection title="About">
          <SettingItem
            icon="ℹ️"
            title="App Version"
            subtitle="1.0.0"
            onPress={() => {}}
            showArrow={false}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="📄"
            title="Terms of Service"
            onPress={() => Alert.alert('Terms', 'Terms of Service coming soon')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="🔒"
            title="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'Privacy Policy coming soon')}
          />
        </SettingSection>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Real-Time Tasks App</Text>
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
  profileSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e5e7eb',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIconText: {
    fontSize: 20,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  settingArrow: {
    fontSize: 24,
    color: '#d1d5db',
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginLeft: 68,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
});