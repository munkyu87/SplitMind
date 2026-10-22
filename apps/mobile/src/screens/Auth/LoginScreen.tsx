import { imageMap } from "@assets/images/imageMap";
import { PRIVACY_HTML_KO, TERMS_HTML_KO } from "@assets/legal/legalHtml";
import Starfield from "@components/themeField/Starfield";
import ThemeToggleButton from "@components/ThemeToggleButton";
import AppContainer from "@components/styled/AppContainer";
import AppText from "@components/styled/AppText";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "@themes/ThemeProvider";
import { AppTheme } from "@themes/theme";
import { hscale, vscale } from "@utils/scale";
import { useEffect } from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import styled from 'styled-components/native';

type SocialType = "kakao" | "naver" | "google";

interface SocialIcon {
  type: SocialType;
  images: {
    light: any;
    dark: any;
    star: any;
  };
}

const LoginScreen = () => {
	const { mode, theme } = useAppTheme();

	const navigation = useNavigation<any>();

  const socialIcons: SocialIcon[] = [
    {
      type: "kakao",
      images: {
        light: imageMap["kakaoDark"],
        dark: imageMap["kakao"],
        star: imageMap["kakaoShadow"], 
      },
    },
    {
      type: "google",
      images: {
        light: imageMap["googleDark"],
        dark: imageMap["googleLight"],
        star: imageMap["googleNatural"], 
      },
    },
    {
      type: "naver",
      images: {
        light: imageMap["naverDark"],
        dark: imageMap["naverLight"],
        star: imageMap["naver"], 
      },
    },
  ];

  const openPolicy = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {}
  };
	
	useEffect(() => {
		console.log('hi')
	}, [])

  const handleLogin = (type: SocialType) => {
    console.log("로그인 시도:", type);
    // TODO: 소셜 로그인 로직 연결
  };

	const themedStyles = (theme: AppTheme) =>
		StyleSheet.create({
			container: {
				flex: 1,
				backgroundColor: theme.background,
				alignItems: 'center',
				justifyContent: 'center',
			},
	});
			
	return (
		<AppContainer isRowCentered>
			<ThemeToggleButton/>
      {/* <Starfield active={mode === 'star'} /> */}
			<Image source={imageMap["splitMindText"]} style={styles.textImage} />
			<Image source={imageMap["splitMind"]} style={styles.image} />
			<AppText size="title" isBold center>{`Life = Choices`}</AppText>
      <View style={styles.iconRow}>
        {socialIcons.map(({ type, images }) => (
          <TouchableOpacity
            key={type}
            style={styles.iconButton}
            onPress={() => handleLogin(type)}
          >
            <Image source={images[mode]} style={styles.iconImage} />
          </TouchableOpacity>
        ))}
			</View>
			<View style={styles.termsBox}>
				<AppText size="footnote" style={{ color: theme.text, opacity: 0.7 }}>
					회원가입 및 서비스 이용을 위해 개인정보 처리방침에 동의합니다.
				</AppText>
				<View style={styles.policyRow}>
					<TouchableOpacity onPress={() => navigation.navigate('HtmlWebView', { html: TERMS_HTML_KO })}>
						<AppText size="footnote" isBold style={styles.linkText}>
							이용약관
						</AppText>
					</TouchableOpacity>
					<AppText size="footnote" style={styles.dot}>
						·
					</AppText>
					<TouchableOpacity onPress={() => navigation.navigate('HtmlWebView', { html: PRIVACY_HTML_KO })}>
					{/* <TouchableOpacity onPress={() => openPolicy('https://example.com/privacy')}> */}
						<AppText size="footnote" isBold style={styles.linkText}>
							개인정보 처리방침
						</AppText>
					</TouchableOpacity>
				</View>
			</View>
		</AppContainer>
	)

}

export default LoginScreen;

const styles = StyleSheet.create({
	textImage: {
		width: hscale(280),
		height: hscale(200),
		marginTop: vscale(100),
		// resizeMode: 'contain',
	},
	image: {
		width: hscale(300),
		height: hscale(180),
		// backgroundColor: 'pink',
		// justifyContent: 'center',
		// alignContent: 'center',
		// marginVertical: vscale(40),
		marginBottom: vscale(40),
		// resizeMode: 'contain',
	},
  iconRow: {
		position: 'absolute',
		bottom: vscale(90),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  iconButton: {
    marginHorizontal: 10,
    borderRadius: 50,
    overflow: "hidden",
  },
  iconImage: {
    width: hscale(50),
    height: hscale(50),
    resizeMode: "contain",
  },
  termsBox: {
    position: 'absolute',
    bottom: vscale(24),
    alignItems: 'center',
    paddingHorizontal: hscale(16),
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  dot: {
    marginHorizontal: 8,
    opacity: 0.5,
  },
})