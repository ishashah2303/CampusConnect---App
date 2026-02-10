import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useEventsStore } from '../store/eventsStore';

export default function CreateEventScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const createEvent = useEventsStore((state) => state.createEvent);

  const handleCreate = async () => {
    if (!title || !location || !startTime || !endTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Parse dates and validate
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      
      if (isNaN(startDate.getTime())) {
        Alert.alert('Error', 'Invalid start time format. Use YYYY-MM-DDTHH:MM');
        setIsLoading(false);
        return;
      }
      
      if (isNaN(endDate.getTime())) {
        Alert.alert('Error', 'Invalid end time format. Use YYYY-MM-DDTHH:MM');
        setIsLoading(false);
        return;
      }
      
      if (endDate <= startDate) {
        Alert.alert('Error', 'End time must be after start time');
        setIsLoading(false);
        return;
      }

      const eventData = {
        title,
        description: description || null,
        location,
        capacity: capacity ? parseInt(capacity, 10) : null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      };

      console.log('Creating event with data:', eventData);
      const newEvent = await createEvent(eventData);
      console.log('Event created successfully:', newEvent);
      
      Alert.alert('Success', 'Event created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Error creating event:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create event';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Event title"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Event description"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Event location"
        />

        <Text style={styles.label}>Start Time * (YYYY-MM-DDTHH:MM)</Text>
        <TextInput
          style={styles.input}
          value={startTime}
          onChangeText={setStartTime}
          placeholder="2024-12-25T10:00"
        />

        <Text style={styles.label}>End Time * (YYYY-MM-DDTHH:MM)</Text>
        <TextInput
          style={styles.input}
          value={endTime}
          onChangeText={setEndTime}
          placeholder="2024-12-25T12:00"
        />

        <Text style={styles.label}>Capacity (optional)</Text>
        <TextInput
          style={styles.input}
          value={capacity}
          onChangeText={setCapacity}
          placeholder="Maximum participants"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleCreate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Event</Text>
          )}
        </TouchableOpacity>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

