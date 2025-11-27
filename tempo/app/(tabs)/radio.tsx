import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Pedometer } from "expo-sensors";
import {StatusBar} from "expo-status-bar";

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
    <View style={styles.container}>
      <StatusBar style="light"/>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Real-time</Text>
      </View>
      {/* Pedometer toggle */}
      <View style={styles.row}>
        <Text style={styles.label}>Pedometer</Text>
        <Switch value={pedometerOn} onValueChange={setPedometerOn} />
      </View>

      {!isAvailable && (
        <Text style={styles.warning}>
          ⚠️ Pedometer is not supported on this device.
        </Text>
      )}

      {/* Steps/min circle */}
      <View style={styles.stepsCircleWrapper}>
        <View style={styles.stepsCircle}>
          <Text style={styles.stepsNumber}>
            {pedometerOn ? stepsPerMin : "--"}
          </Text>
          <Text style={styles.stepsLabel}>steps / min</Text>
        </View>
      </View>

      {/* Switch between pedometer-based and manual slider BPM */}
      {pedometerOn ? (
        <View style={styles.sliderSection}>
          <Text style={styles.pedometerInfo}>
            Using pedometer input to set BPM: {stepsPerMin > 0 ? stepsPerMin : "--"} BPM
          </Text>
          <View style={styles.sliderHeader}>
            <Text style={styles.label}>Target BPM</Text>
            <Text style={styles.bpmValue}>{Math.round(bpm)} BPM</Text>
          </View>
        </View>
      ) : (
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.label}>Target BPM</Text>
            <Text style={styles.bpmValue}>{Math.round(bpm)} BPM</Text>
          </View>

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

          <View style={styles.sliderTicks}>
            <Text style={styles.tickLabel}>60</Text>
            <Text style={styles.tickLabel}>130</Text>
            <Text style={styles.tickLabel}>200</Text>
          </View>
        </View>
      )}

      {/* Music Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => {
            // TODO API call for skip back
            console.log("Skip back");
          }}
        >
          <Text style={styles.controlButtonText}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => {
            // TODO API call for pause/play
            setIsPlaying(!isPlaying);
            console.log(isPlaying ? "Pausing" : "Playing");
          }}
        >
          <Text style={styles.controlButtonText}>
            {isPlaying ? "⏸" : "▶"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => {
            // TODO: API call for skip forward
            console.log("Skip forward");
          }}
        >
          <Text style={styles.controlButtonText}>⏭</Text>
        </TouchableOpacity>
      </View>

      </View>


  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0D",
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header:{
    alignItems:"center", 
    marginTop:40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: "#EDEDED",
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 3,
    borderColor: 'rgba(29,185,84,0.9)',
  },
  stepsNumber: {
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepsLabel: {
    fontSize: 14,
    color: "#CFCFCF",
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
    color: "#BDBDBD",
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
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "#1DB954",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: '#0F7A3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  controlButtonText: {
    fontSize: 24,
    color: "#ffffff",
  },
  pedometerInfo: {
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 8,
  },
});
