import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAppStore } from '../../src/store';
import { spacing, fontSize, borderRadius } from '../../src/theme/spacing';
import { getGroqApiKey, setGroqApiKey, isGroqConfigured } from '../../src/services/groq';
import {
  getGistToken,
  setGistToken,
  clearGistToken,
  createSyncGist,
  isSyncConfigured,
  syncInbox,
} from '../../src/services/inbox-sync';

const STALE_OPTIONS = [3, 5, 7] as const;

export default function SettingsScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const lastSynced = useAppStore((s) => s.lastSynced);
  const gistId = useAppStore((s) => s.gistId);
  const setGistIdStore = useAppStore((s) => s.setGistId);
  const inbox = useAppStore((s) => s.inbox);
  const setInbox = useAppStore((s) => s.setInbox);
  const setLastSynced = useAppStore((s) => s.setLastSynced);

  // Persisted fields (loaded from secure store)
  const [groqKey, setGroqKey] = useState('');
  const [groqConfigured, setGroqConfigured] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [syncConfigured, setSyncConfigured] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Local-only prefs
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [staleThreshold, setStaleThreshold] = useState<(typeof STALE_OPTIONS)[number]>(5);

  // Load saved values on mount
  useEffect(() => {
    (async () => {
      const savedGroq = await getGroqApiKey();
      if (savedGroq) {
        setGroqKey(savedGroq);
        setGroqConfigured(true);
      }
      const savedToken = await getGistToken();
      if (savedToken) {
        setGithubToken(savedToken);
      }
      const configured = await isSyncConfigured();
      setSyncConfigured(configured);
    })();
  }, []);

  const handleSaveGroqKey = useCallback(async () => {
    const trimmed = groqKey.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a Groq API key.');
      return;
    }
    await setGroqApiKey(trimmed);
    setGroqConfigured(true);
    Alert.alert('Saved', 'Groq API key saved securely.');
  }, [groqKey]);

  const handleSaveGithubToken = useCallback(async () => {
    const trimmed = githubToken.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a GitHub Personal Access Token.');
      return;
    }
    await setGistToken(trimmed);

    // Create gist if not already configured
    if (!gistId) {
      try {
        const newGistId = await createSyncGist();
        setGistIdStore(newGistId);
        setSyncConfigured(true);
        Alert.alert('Sync Ready', `Sync gist created. ID: ${newGistId.slice(0, 8)}...`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to create gist';
        Alert.alert('Error', msg);
        return;
      }
    } else {
      setSyncConfigured(true);
      Alert.alert('Saved', 'GitHub token saved securely.');
    }
  }, [githubToken, gistId, setGistIdStore]);

  const handleDisconnectSync = useCallback(async () => {
    Alert.alert(
      'Disconnect Sync',
      'This will remove your GitHub token. The gist will remain on GitHub.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await clearGistToken();
            setGithubToken('');
            setSyncConfigured(false);
          },
        },
      ]
    );
  }, []);

  const handleForceSync = useCallback(async () => {
    if (!syncConfigured) {
      Alert.alert('Not Configured', 'Set up GitHub sync first.');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncInbox(inbox);
      if (result.newFromRemote > 0) {
        setInbox(result.merged);
      }
      setLastSynced(new Date().toISOString());
      Alert.alert(
        'Sync Complete',
        `${result.newFromRemote} new from cloud, ${result.newFromLocal} pushed.`
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Sync failed';
      Alert.alert('Sync Failed', msg);
    } finally {
      setIsSyncing(false);
    }
  }, [syncConfigured, inbox, setInbox, setLastSynced]);

  const styles = makeStyles(colors, insets);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>AC</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Arun Castro</Text>
                <Text style={styles.profileEmail}>Orbit</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons
                  name={mode === 'dark' ? 'moon' : 'sunny'}
                  size={20}
                  color={colors.textPrimary}
                />
                <Text style={styles.settingLabel}>
                  {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>
              <Switch
                value={mode === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{
                  false: colors.borderLight,
                  true: colors.primary + '66',
                }}
                thumbColor={mode === 'dark' ? colors.primary : '#ffffff'}
              />
            </View>
          </View>
        </View>

        {/* Inbox Sync Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inbox Sync</Text>
          <View style={styles.card}>
            {/* Status indicator */}
            <View style={styles.syncStatusRow}>
              <View
                style={[
                  styles.syncDot,
                  { backgroundColor: syncConfigured ? '#10b981' : colors.textMuted },
                ]}
              />
              <Text style={styles.syncStatusText}>
                {syncConfigured ? 'Connected' : 'Not configured'}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* GitHub Token */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GitHub Personal Access Token</Text>
              <TextInput
                style={styles.textInput}
                placeholder="ghp_..."
                placeholderTextColor={colors.textMuted}
                value={githubToken}
                onChangeText={setGithubToken}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
              <Text style={styles.inputHint}>
                Needs &quot;gist&quot; scope. Create at github.com/settings/tokens
              </Text>
            </View>

            {!syncConfigured ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSaveGithubToken}
                activeOpacity={0.7}
              >
                <Ionicons name="link" size={18} color={colors.primary} />
                <Text style={styles.actionButtonText}>Connect Sync</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.syncActionsColumn}>
                {/* Gist ID display */}
                {gistId && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Gist ID</Text>
                    <Text style={styles.infoValue}>{gistId.slice(0, 12)}...</Text>
                  </View>
                )}

                {/* Last Synced */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Last synced</Text>
                  <Text style={styles.infoValue}>
                    {lastSynced
                      ? new Date(lastSynced).toLocaleString()
                      : 'Never'}
                  </Text>
                </View>

                {/* Force Sync */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleForceSync}
                  activeOpacity={0.7}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="sync" size={18} color={colors.primary} />
                  )}
                  <Text style={styles.actionButtonText}>
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Text>
                </TouchableOpacity>

                {/* Disconnect */}
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={handleDisconnectSync}
                  activeOpacity={0.7}
                >
                  <Ionicons name="unlink" size={16} color="#ef4444" />
                  <Text style={styles.disconnectText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Voice AI Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice AI</Text>
          <View style={styles.card}>
            {/* Status */}
            <View style={styles.syncStatusRow}>
              <View
                style={[
                  styles.syncDot,
                  { backgroundColor: groqConfigured ? '#10b981' : colors.textMuted },
                ]}
              />
              <Text style={styles.syncStatusText}>
                {groqConfigured ? 'API key saved' : 'Not configured'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Groq API Key</Text>
              <TextInput
                style={styles.textInput}
                placeholder="gsk_..."
                placeholderTextColor={colors.textMuted}
                value={groqKey}
                onChangeText={setGroqKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSaveGroqKey}
              activeOpacity={0.7}
            >
              <Ionicons name="save" size={18} color={colors.primary} />
              <Text style={styles.actionButtonText}>Save Key</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={colors.textPrimary}
                />
                <Text style={styles.settingLabel}>Enable Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: colors.borderLight,
                  true: colors.primary + '66',
                }}
                thumbColor={notificationsEnabled ? colors.primary : '#ffffff'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Stale Threshold (days)</Text>
              <View style={styles.chipRow}>
                {STALE_OPTIONS.map((option) => {
                  const isActive = staleThreshold === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.chip,
                        isActive && styles.chipActive,
                      ]}
                      onPress={() => setStaleThreshold(option)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isActive && styles.chipTextActive,
                        ]}
                      >
                        {option}d
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Version</Text>
              <Text style={styles.infoValue}>0.1.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Built with</Text>
              <Text style={styles.infoValue}>Expo + React Native</Text>
            </View>
          </View>
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  insets: { top: number }
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: insets.top + spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxxl,
    },

    // Screen Title
    screenTitle: {
      fontSize: fontSize.xxl,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xxl,
    },

    // Section
    section: {
      marginBottom: spacing.xxl,
    },
    sectionTitle: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },

    // Profile
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary + '26',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.primary,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    profileEmail: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: 2,
      fontWeight: '400',
    },

    // Setting Row
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
    },
    settingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    settingLabel: {
      fontSize: fontSize.md,
      color: colors.textPrimary,
      fontWeight: '400',
    },

    // Sync status
    syncStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    syncDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    syncStatusText: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    syncActionsColumn: {
      gap: spacing.md,
    },

    // Input Group
    inputGroup: {
      marginBottom: spacing.lg,
    },
    inputLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    inputHint: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      fontWeight: '400',
      marginTop: spacing.xs,
    },
    textInput: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: fontSize.md,
      color: colors.textPrimary,
      height: 48,
    },

    // Chip Row
    chipRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 44,
      alignItems: 'center',
    },
    chipActive: {
      backgroundColor: colors.primary + '26',
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.primary,
    },

    // Info Row
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 36,
    },
    infoLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontWeight: '400',
    },
    infoValue: {
      fontSize: fontSize.sm,
      color: colors.textPrimary,
      fontWeight: '600',
    },

    // Action Button
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.primary + '40',
      backgroundColor: colors.primary + '0D',
      minHeight: 48,
    },
    actionButtonText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.primary,
    },

    // Disconnect
    disconnectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    disconnectText: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: '#ef4444',
    },

    // Divider
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.md,
    },
  });
}
