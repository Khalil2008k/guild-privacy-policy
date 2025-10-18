import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Shield } from 'lucide-react-native';

interface LogoProps {
  variant?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'horizontal', 
  size = 'medium',
  color = '#2D2D2D'
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { iconSize: 16, fontSize: 14, gap: 8 };
      case 'large':
        return { iconSize: 32, fontSize: 28, gap: 16 };
      default:
        return { iconSize: 24, fontSize: 20, gap: 12 };
    }
  };

  const { iconSize, fontSize, gap } = getSize();

  const styles = StyleSheet.create({
    container: {
      flexDirection: variant === 'horizontal' ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: gap,
    },
    text: {
      color: color,
      fontSize: fontSize,
      fontWeight: 'bold',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  });

  return (
    <View style={styles.container}>
      <Shield size={iconSize} color={color} />
      <View style={styles.text}>GUILD</View>
    </View>
  );
};

export default Logo;

