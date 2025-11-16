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

      {/* BPM slider */}
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

      </View>


  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0f",
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
    color: "#ffffff",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: "#ffffff",
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
    color: "#ffffff",
  },
  stepsLabel: {
    fontSize: 14,
    color: "#cccccc",
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
});
