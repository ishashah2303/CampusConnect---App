import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useEventsStore } from '../store/eventsStore';
import { useAuthStore } from '../store/authStore';
import api from '../config/api';

export default function EventDetailScreen({ route, navigation }: any) {
  const { event: initialEvent } = route.params;
  const [event, setEvent] = useState(initialEvent);
  const [isJoining, setIsJoining] = useState(false);
  const { joinEvent, leaveEvent } = useEventsStore();
  const user = useAuthStore((state) => state.user);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await joinEvent(event.id);
      Alert.alert('Success', 'You have joined this event!');
      navigation.navigate('Chat', { eventId: event.id });
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to join event'
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setIsJoining(true);
    try {
      await leaveEvent(event.id);
      Alert.alert('Success', 'You have left this event');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to leave event');
    } finally {
      setIsJoining(false);
    }
  };

  const handleChat = () => {
    navigation.navigate('Chat', { eventId: event.id });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        
        {event.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.info}>📍 {event.location}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time</Text>
          <Text style={styles.info}>
            📅 {new Date(event.start_time).toLocaleString()}
          </Text>
          <Text style={styles.info}>
            📅 {new Date(event.end_time).toLocaleString()}
          </Text>
        </View>

        {event.capacity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Capacity</Text>
            <Text style={styles.info}>{event.capacity} participants</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, styles.chatButton]}
          onPress={handleChat}
        >
          <Text style={styles.buttonText}>Open Chat</Text>
        </TouchableOpacity>

        {user && user.id === event.creator_id ? (
          <Text style={styles.creatorText}>You created this event</Text>
        ) : (
          <TouchableOpacity
            style={[styles.button, isJoining && styles.buttonDisabled]}
            onPress={handleJoin}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Join Event</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  info: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  chatButton: {
    backgroundColor: '#34C759',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  creatorText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

