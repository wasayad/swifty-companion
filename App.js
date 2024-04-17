import { StyleSheet, Text, View, TextInput, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import axios from 'axios';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

const Screen1 = ({token}) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log(`Bearer ${token}`);
    if (searchQuery != '')
      axios.get(`https://api.intra.42.fr/v2/users?range[login]=${searchQuery},${searchQuery}zzzzz`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((response) => {
        console.log(response);
      }).catch( (error) => {
        console.log(error);
      });
  }, [searchQuery]);
return (
  <View style={styles.container}>
    <TextInput
      style={styles.input}
      placeholder="Search"
      value={searchQuery}
      onChangeText={setSearchQuery}
    />
  </View>
);
};

const Screen2 = () => {
  return (
    <View style={styles.container}>
      <Text>Screen 2</Text>
    </View>
  );
};

const AppNavigator = ({token}) => {
  console.log('AppNavigator =', token);
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" children={()=><Screen1 token={token}/>}/>
        <Tab.Screen name="Settings" component={Screen2} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');

  // useEffect(() => {
  //   console.log(token);
  // }, [token]);

  const GenerateWebView = () => {
    return <WebView
      source={{ uri: 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-0f134cf314e72c2f4db738d9a6420be677491ab3a0556ac4e85129cc13891824&redirect_uri=https%3A%2F%2Fapi.intra.42.fr%2Fapidoc%2Fguides%2Fgetting_started&response_type=code' }}
      style={styles.webview}
      onNavigationStateChange={_onNavigationStateChange.bind(this)}
    />
  }


  async function _onNavigationStateChange(webViewState) {
    if (webViewState.url.includes("code=")) {
      const startIndex = webViewState.url.indexOf('code=');
      if (startIndex !== -1) {
        setCode(webViewState.url.substring(startIndex + 5));
        axios.post('https://api.intra.42.fr/oauth/token/', {
          client_id: "u-s4t2ud-0f134cf314e72c2f4db738d9a6420be677491ab3a0556ac4e85129cc13891824",
          client_secret: "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",
          code: webViewState.url.substring(startIndex + 5),
          redirect_uri: "https://api.intra.42.fr/apidoc/guides/getting_started",
          grant_type: "authorization_code",
        }).then((response) => {
          setToken(response.data.access_token)
        });
      }
    }
  }
  return (
    code != '' ? <AppNavigator token={token} /> :
      <GenerateWebView />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'top',
  },
  webview: {
    flex: 1,
  },
  input: {
    height: 40,
    width: width * 0.8,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 16,
    paddingLeft: 8,
  },
});
