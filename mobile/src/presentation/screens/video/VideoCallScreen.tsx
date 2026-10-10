import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../../../shared/theme';
import { Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type VideoCallRouteParams = {
  sessionId: string;
  channelName: string;
  token?: string;
  isTutor: boolean;
};

export default function VideoCallScreen() {
  const route = useRoute<RouteProp<{ params: VideoCallRouteParams }, 'params'>>();
  const navigation = useNavigation();
  const { sessionId, channelName, token, isTutor } = route.params;

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');

  useEffect(() => {
    setupCall();
  }, []);

  const setupCall = async () => {
    // Request camera permission
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera access is needed for video calls.');
        navigation.goBack();
        return;
      }
    }
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
    }, 1500);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  const flipCamera = () => {
    setFacing(current => (current === 'front' ? 'back' : 'front'));
  };

  const endCall = () => {
    Alert.alert('End Call', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Call',
        style: 'destructive',
        onPress: () => {
          navigation.goBack();
        },
      },
    ]);
  };

  if (isConnecting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Connecting to session...</Text>
        <Text style={styles.noteText}>
          Note: Full video calling requires native build. This is a demo preview.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Preview (Local video) */}
      {!isVideoOff && cameraPermission?.granted ? (
        <CameraView style={styles.camera} facing={facing} />
      ) : (
        <View style={styles.videoOffContainer}>
          <VideoOff size={64} color={colors.white} />
          <Text style={styles.videoOffText}>Camera is off</Text>
        </View>
      )}

      {/* Remote video placeholder */}
      <View style={styles.remoteVideoPlaceholder}>
        <Ionicons name="person-circle" size={80} color="rgba(255,255,255,0.5)" />
        <Text style={styles.waitingText}>
          Waiting for {isTutor ? 'student' : 'tutor'} to join...
        </Text>
        <Text style={styles.noteText}>
          Real-time video requires native build with Agora SDK
        </Text>
      </View>

      {/* Session info */}
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionText}>
          {isTutor ? '👨‍🏫 Tutor' : '🎓 Student'} | Session: {sessionId.slice(0, 8)}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
          onPress={toggleMute}
        >
          {isMuted ? (
            <MicOff size={28} color={colors.white} />
          ) : (
            <Mic size={28} color={colors.white} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]}
          onPress={toggleVideo}
        >
          {isVideoOff ? (
            <VideoOff size={28} color={colors.white} />
          ) : (
            <Video size={28} color={colors.white} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={flipCamera}
        >
          <Ionicons name="camera-reverse" size={28} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
          <PhoneOff size={28} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  noteText: {
    marginTop: 12,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  camera: {
    width: width,
    height: height,
  },
  videoOffContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOffText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.white,
  },
  remoteVideoPlaceholder: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  waitingText: {
    fontSize: 10,
    color: colors.white,
    textAlign: 'center',
    marginTop: 8,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 20,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: colors.error,
  },
  endCallBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sessionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
