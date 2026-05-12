import { Share, TouchableOpacity, Text, StyleSheet } from 'react-native';

const ShareButton = ({ title, url, message }: { 
  title: string; 
  url: string; 
  message: string 
}) => {
  const handleShare = async () => {
    try {
      await Share.share({
        title: title,
        message: `${message}\n\n${url}`, 
        url: url, 
      });
    } catch (error) {
      console.error('Erro ao partilhar:', error);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleShare}>
      <Text style={styles.text}>⬆ Partilhar</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ShareButton;