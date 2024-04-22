import { StyleSheet, Text, View, TextInput, Dimensions, FlatList, Image, TouchableOpacity } from 'react-native';
import { ProgressBarAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import beluga from "./assets/beluga.jpg"
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { API_SECRET, API_ID } from '@env';


const { width } = Dimensions.get('window');
const { height } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

const Screen1 = ({ token }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();

  const selectProfile = (user, token) => {
    navigation.navigate('Profile', { user: user, token: token });
  };
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => selectProfile(item, token)}>
      {
        item.image.link ?
          <Image style={styles.image} source={{ uri: item.image.link }} ></Image> :
          <Image style={styles.image} source={beluga}></Image>
      }
      <Text style={styles.itemText}>{item.login}</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    if (searchQuery != '') {
      const delayDebounceFn = setTimeout(() => {
        axios.get(`https://api.intra.42.fr/v2/users?range[login]=${searchQuery},${searchQuery}zzzzz`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          setUsers(response.data)
        }).catch((error) => {
          console.log(error);
        });
      }, 1500)
      return () => clearTimeout(delayDebounceFn)
    }
    else {
      setUsers([]);
    }
  }, [searchQuery]);


  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
      />
    </View>
  );
};






const Screen2 = ({ route }) => {
  const [user, setUser] = useState("");
  const [cursus, setCursus] = useState(0);
  const token = route.params ? route.params.token ? route.params.token : '' : '';

  const renderItemCursus = ({ item }) => (
    <View style={styles.itemProfile}>
      <Text style={styles.itemText}>{item.name + ": " + item.level}</Text>
      <ProgressBarAndroid
        style={styles.progressBar}
        styleAttr="Horizontal"
        indeterminate={false}
        progress={item.level / 21}
        color="#2196F3"
      />
    </View>
  );
  const renderItemProject = ({ item }) => (
    <View style={styles.itemProfile}>
      <Text style={styles.itemText}>{item.project.name}</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.itemProfile}>
      {item.label ? <Text style={styles.itemText}>{item.label}</Text> : null}
      <Text style={styles.itemText}>{item.data}</Text>
    </View>
  );

  useEffect(() => {
    if (route.params) {
      axios.get(`https://api.intra.42.fr/v2/users/${route.params.user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((response) => {
        setUser(response.data);
        for (let i = 0; i < 5; i++) {
          if (response.data.cursus_users[i] && response.data.cursus_users[i].grade === "Member") {
            setCursus(i);
            break;
          }
        }
      }).catch((error) => {
        console.log(error);
      });
    }
    
  }, [route])
  return (
    <View style={styles.container}>
      {
        user != "" ?
          <View style={styles.container}>
            <Image style={styles.profileImage} source={
              user.image.link ?
                { uri: user.image.link } :
                beluga
            } />
            <FlatList
              style={styles.list}
              data={[
                { label: null, data: "correction point: " + user.correction_point },
                { label: null, data: user.login },
                { label: null, data: "wallet: " + user.wallet },
                { label: null, data: user.email }
              ]}
              renderItem={renderItem}
              numColumns={1}
            />
            <Text style={styles.itemText}> Skills</Text>
            {user.cursus_users[cursus] ?
              <FlatList
                style={styles.list}
                data={user.cursus_users[cursus].skills}
                renderItem={renderItemCursus}
                numColumns={1}
              /> : <Text style={styles.error}> Not found </Text>
            }

            <Text style={styles.itemText}> Project</Text>
            <FlatList
              style={styles.list}
              data={user.projects_users}
              renderItem={renderItemProject}
              numColumns={1}
            />
          </View>
          : null
      }
    </View>


  );
};

const AppNavigator = ({ token }) => {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Search" children={() => <Screen1 token={token ? token :''} />} />
        <Tab.Screen name="Profile" component={Screen2} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default function App() {

  const [isConnected, setIsConnected] = useState(null);
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');


  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const GenerateWebView = () => {
    return <WebView
      source={{ uri: `https://api.intra.42.fr/oauth/authorize?client_id=${API_ID}&redirect_uri=https%3A%2F%2Fapi.intra.42.fr%2Fapidoc%2Fguides%2Fgetting_started&response_type=code` }}
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
          client_id: API_ID,
          client_secret: API_SECRET,
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
    isConnected ? code != '' ? <AppNavigator token={token} /> :
      <GenerateWebView /> :<View style={styles.errorContainer}><Text style={styles.error}> There's no connection </Text></View> 
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
  item: {
    backgroundColor: '#f9c2ff',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    margin: 5,
    width: width / 2.2, // Subtracting some margin
  },
  progressBar: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.7,
  },
  itemProfile: {
    backgroundColor: '#D3D3D3',
    alignItems: 'center',
    justifyContent: 'center',
    height: 35,
    margin: 5,
    width: width * 0.8, // Subtracting some margin
  },
  itemText: {
    fontSize: 18,
  },
  image: {
    width: 50,
    height: 50,
  },
  profileImage: {
    width: width,
    height: height / 5,
  },
  list: {

    height: height / 4,
    margin: 10,
  },
  error: {
    fontSize: 18,
    color: 'red',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    height: height,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
