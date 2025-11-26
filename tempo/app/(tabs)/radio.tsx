import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Platform,
  TextInput,
  StyleSheet,
  Switch,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Pedometer } from "expo-sensors";
import {StatusBar} from "expo-status-bar";
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RealTimeRadioScreen() {
  const [pedometerOn, setPedometerOn] = useState<boolean>(true);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [stepsPerMin, setStepsPerMin] = useState<number>(0);
  const [bpm, setBpm] = useState<number>(120);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // check if pedometer is available
  useEffect(() => {
    Pedometer.isAvailableAsync().then((result) => {
      setIsAvailable(result);
    });
  }, []);

  // subscribe to step count and compute steps/min
  useEffect(() => {
    if (!pedometerOn) return;

    let lastSteps = 0;
    let lastTime = Date.now();

    const subscription = Pedometer.watchStepCount((result) => {
      const now = Date.now();
      const diffMinutes = (now - lastTime) / 1000 / 60;
      const stepDiff = result.steps - lastSteps;

      if (stepDiff > 0 && diffMinutes > 0) {
        const spm = stepDiff / diffMinutes;
        setStepsPerMin(Math.round(spm));
      }

      lastSteps = result.steps;
      lastTime = now;
    });

    return () => subscription.remove();
  }, [pedometerOn]);

  // sync BPM from pedometer when pedometer is on (and clamp to slider range)
  useEffect(() => {
    if (pedometerOn && stepsPerMin > 0) {
      const clamped = Math.max(60, Math.min(200, stepsPerMin));
      setBpm(clamped);
    }
  }, [pedometerOn, stepsPerMin]);

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light"/>

      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Real-time</ThemedText>
      </ThemedView>
      {/* Pedometer toggle */}
      <ThemedView style={styles.row}>
        <ThemedText type="default" style={styles.label}>Pedometer</ThemedText>
        <Switch value={pedometerOn} onValueChange={setPedometerOn} />
      </ThemedView>

      {!isAvailable && (
        <ThemedText type="default" style={styles.warning}>
          ⚠️ Pedometer is not supported on this device.
        </ThemedText>
      )}

      {/* Steps/min circle */}
      <ThemedView style={styles.stepsCircleWrapper}>
        <ThemedView style={styles.stepsCircle}>
          <ThemedText type="title" style={styles.stepsNumber}>
            {pedometerOn ? stepsPerMin : "--"}
          </ThemedText>
          <ThemedText type="default" style={styles.stepsLabel}>steps / min</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Switch between pedometer-based and manual slider BPM */}
      {pedometerOn ? (
        <ThemedView style={styles.sliderSection}>
          <ThemedText type="default" style={styles.pedometerInfo}>
            Using pedometer input to set BPM: {stepsPerMin > 0 ? stepsPerMin : "--"} BPM
          </ThemedText>
          {/* show read-only value in the same pattern as saved playlist */}
          <ThemedView style={styles.sliderHeader}>
            <ThemedText type="default">Target BPM</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.bpmValue}>{Math.round(bpm)} BPM</ThemedText>
          </ThemedView>
        </ThemedView>
      ) : (
        <ThemedView style={styles.sliderSection}>
          <ThemedView style={styles.sliderHeader}>
            <ThemedText type="default">Target BPM</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.bpmValue}>{Math.round(bpm)} BPM</ThemedText>
          </ThemedView>

          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={60}
            maximumValue={200}
            step={1}
            value={bpm}
            onValueChange={(value: number) => setBpm(value)}
            minimumTrackTintColor="#1DB954"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#1DB954"
          />

          <ThemedView style={styles.sliderTicks}>
            <ThemedText type="default" style={styles.tickLabel}>60</ThemedText>
            <ThemedText type="default" style={styles.tickLabel}>130</ThemedText>
            <ThemedText type="default" style={styles.tickLabel}>200</ThemedText>
          </ThemedView>
        </ThemedView>
      )}

      {/* Music Controls */}
      <ThemedView style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, styles.smallControl]}
          onPress={() => {
            // TODO API call for skip back
            console.log("Skip back");
          }}
        >
          <ThemedText type="defaultSemiBold" style={styles.controlButtonText}>⏮</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, styles.playControl]} 
          onPress={() => {
            // TODO API call for pause/play
            setIsPlaying(!isPlaying);
            console.log(isPlaying ? "Pausing" : "Playing");
          }}
        >
          <ThemedText type="defaultSemiBold" style={[styles.controlButtonText, styles.playControlText]}>
            {isPlaying ? "⏸" : "▶"}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, styles.smallControl]} 
          onPress={() => {
            // TODO: API call for skip forward
            console.log("Skip forward");
          }}
        >
          <ThemedText type="defaultSemiBold" style={styles.controlButtonText}>⏭</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      </ThemedView>


  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header:{
    alignItems:"center", 
    marginTop:40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
  },
  warning: {
    color: "#ff6b6b",
    marginBottom: 12,
  },
  stepsCircleWrapper: {
    alignItems: "center",
    marginBottom: 32,
  },
  stepsCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: "#1DB954",
    alignItems: "center",
    justifyContent: "center",
  },
  stepsNumber: {
    fontSize: 42,
    fontWeight: "700",
  },
  stepsLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  sliderSection: {
    paddingVertical: 12,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bpmValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1DB954",
  },
  sliderTicks: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  tickLabel: {
    fontSize: 12,
    color: "#aaaaaa",
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingVertical: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  tabTextInactive: {
    color: "#888",
    fontSize: 14,
  },
  tabTextActive: {
    color: "#1DB954",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: "#1DB954",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    marginTop: 40,
  },
  controlButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallControl: {
    width: 60,
    height: 60,
  },
  playControl: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'transparent',
  },
  playControlText: {
    color: '#1DB954',
  },
  controlButtonText: {
    fontSize: 24,
  },
  pedometerInfo: {
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 8,
  },
});


