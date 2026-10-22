import { imageMap } from "@assets/images/imageMap";
import { useAppTheme } from "@themes/ThemeProvider";
import { hscale, vscale } from "@utils/scale";
import { useRef, useState } from "react";
import { Animated, Image, StyleSheet, TouchableOpacity, View } from "react-native"

const ThemeToggleButton = () => {
  const { mode, setMode } = useAppTheme();
  const [currentIcon, setCurrentIcon] = useState(mode);

  const position = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
	
  const glowScale = useRef(new Animated.Value(0.5)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // const handleToggleTheme = () => {
  //   if (mode === "light") setMode("dark");
  //   else if (mode === "dark") setMode("dim");
  //   else setMode("light");

  //   startGlowAnimation();
  // };

  const handleToggleTheme = () => {
    // Step 1: 왼쪽으로 이동 & 투명도 낮추기
    Animated.parallel([
      Animated.timing(position, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Step 2: mode 변경
      let newMode: "light" | "dark" | "star";
      if (mode === "light") newMode = "dark";
      else if (mode === "dark") newMode = "star";
      else newMode = "light";

      setMode(newMode);
      // setCurrentIcon(newMode);

      // Step 3: 새로운 아이콘을 오른쪽에서 들어오게
      position.setValue(50);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(position, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const getIconName = () => {
    if (mode === "light") return "sun";
    if (mode === "dark") return "moon";
    return "star";
  };

  const startGlowAnimation = () => {
    glowScale.setValue(0.5);
    glowOpacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(glowScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(glowScale, {
          toValue: 1.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

	const glowColors: Record<string, string> = {
    light: "rgba(255, 223, 0, 0.5)",
    dark: "rgba(135, 206, 250, 0.5)",
    star: "rgba(255, 140, 0, 0.5)",
  };

	return (
		<TouchableOpacity style={styles.button} onPress={handleToggleTheme}>
      {/* <Animated.View
        style={[
          styles.bottomGlow,
          {
            backgroundColor: glowColors[mode],
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      /> */}
			<Animated.Image
        source={imageMap[getIconName()]}
        style={[
          styles.image,
          { transform: [{ translateX: position }], opacity },
        ]}
      />
			{/* <Image source={imageMap[getIconName()]} style={styles.image} /> */}
		</TouchableOpacity>
	)
}

export default ThemeToggleButton;

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 8,
		alignItems: 'center',
		justifyContent: 'center',
  },
  bottomGlow: {
    position: "absolute",
    bottom: -3,
    width: hscale(40),
    height: vscale(20),
    borderRadius: hscale(20),
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  // glow: {
  //   position: "absolute",
  //   width: hscale(60),
  //   height: hscale(60),
  //   borderRadius: hscale(30),
  //   backgroundColor: "rgba(255, 223, 0, 0.4)",
  //   shadowColor: "#FFD700",
  //   shadowOffset: { width: 0, height: 0 },
  //   shadowOpacity: 0.8,
  //   shadowRadius: 10,
  //   elevation: 10, // Android 그림자
  // },
  image: {
    width: hscale(30),
    height: hscale(30),
    resizeMode: "contain",
  },
});