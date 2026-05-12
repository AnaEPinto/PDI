import React, { useState, useEffect, useRef, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { Animated, View, Text, StyleSheet, Image } from "react-native";
import AppNavigator from "./src/navigations/AppNavigator";

SplashScreen.preventAutoHideAsync();

function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]),
      Animated.timing(textFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(barAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
    ]).start(() => setTimeout(onFinish, 200));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image source={require("./assets/logotipo.jpg")} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={{ opacity: textFade, alignItems: "center", marginTop: 32 }}>
        <Text style={styles.appName}>Eventos ISCAC</Text>
        <View style={styles.divider} />
        <Text style={styles.appSub}>Coimbra Business School</Text>
      </Animated.View>

      <View style={styles.barContainer}>
        <Animated.View style={[styles.barFill, {
          width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
        }]} />
      </View>

      <Text style={styles.footer}>Politécnico de Coimbra</Text>
    </View>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  const onLayoutRootView = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#1157ed" }} onLayout={onLayoutRootView}>
      {!splashDone ? (
        <AnimatedSplash onFinish={() => setSplashDone(true)} />
      ) : (
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1157ed", alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  circleTop: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "#ffffff10", top: -80, right: -80 },
  circleBottom: { position: "absolute", width: 250, height: 250, borderRadius: 125, backgroundColor: "#ffffff08", bottom: -60, left: -60 },
  logoWrapper: { width: 140, height: 140, borderRadius: 32, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", padding: 16, elevation: 12 },
  logo: { width: 108, height: 108 },
  appName: { fontSize: 28, fontWeight: "bold", color: "#fff", letterSpacing: 0.5 },
  divider: { width: 40, height: 2, backgroundColor: "#ffffff55", borderRadius: 1, marginVertical: 10 },
  appSub: { fontSize: 13, color: "#ffffffaa", letterSpacing: 0.4 },
  barContainer: { width: "65%", height: 3, backgroundColor: "#ffffff25", borderRadius: 2, overflow: "hidden", marginTop: 52 },
  barFill: { height: "100%", backgroundColor: "#ffffffcc", borderRadius: 2 },
  footer: { position: "absolute", bottom: 52, fontSize: 12, color: "#ffffff55", letterSpacing: 0.5 },
});