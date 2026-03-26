import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';

const poema = [
  "El viento me lleva",
  "La noche me cubre",
  "Palabras que explotan",
  "Sombras que susurran",
  "El tiempo se rompe"
];

export default function App() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<number | null>(null);

  const [versoActual, setVersoActual] = useState(0);

  const scrollAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startRecording();

    return () => {
      void stopRecording();
    };
  }, []);

  const startRecording = async () => {
    if (recordingRef.current) return;

    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();

      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      await recording.startAsync();
      recordingRef.current = recording;

      let lastTime = 0;

      intervalRef.current = setInterval(async () => {
        if (!recordingRef.current) return;

        const status = await recordingRef.current.getStatusAsync();

        // 👇 detecta "actividad" del mic (aunque no haya metering)
        if (status.isRecording) {
          const now = Date.now();

          // si pasa tiempo + hay audio → sube verso
          if (now - lastTime > 800) {
            lastTime = now;

            setVersoActual((prev) => {
              const next = Math.min(prev + 1, poema.length);

              Animated.spring(scrollAnim, {
                toValue: -(next * 100),
                useNativeDriver: true
              }).start();

              return next;
            });
          }
        }
      }, 300);

    } catch (err) {
      console.log("ERROR MIC:", err);
    }
  };

  const stopRecording = async () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>GRITA</Text>

      <Animated.View style={{ transform: [{ translateY: scrollAnim }] }}>
        {poema.map((linea, index) => (
          <Text key={index} style={styles.linea}>
            {linea}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 20
  },
  titulo: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#f00',
    textAlign: 'center',
    marginVertical: 50
  },
  linea: {
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 40
  }
});