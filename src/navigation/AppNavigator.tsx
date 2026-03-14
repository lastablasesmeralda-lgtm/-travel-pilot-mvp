import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text } from 'react-native';

import IntelScreen from '../screens/IntelScreen';
import RadarScreen from '../screens/RadarScreen';
import VaultScreen from '../screens/VaultScreen';
import BioScreen from '../screens/BioScreen';
import { s } from '../styles';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
    return (
        <Tab.Navigator
            id="AppTabs"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    height: 90,
                    backgroundColor: '#111',
                    borderTopWidth: 1,
                    borderColor: '#222',
                    paddingBottom: 25,
                },
                tabBarButton: (props) => {
                    let icon = '';
                    if (route.name === 'Intel') icon = '💠';
                    else if (route.name === 'Radar') icon = '🔘';
                    else if (route.name === 'Vault') icon = '🛡️';
                    else if (route.name === 'Bio') icon = '👥';

                    const isFocused = props.accessibilityState?.selected;

                    return (
                        <TouchableOpacity
                            {...(props as any)}
                            style={[s.ni, { flexDirection: 'column', alignItems: 'center' }]}
                        >
                            <Text style={{
                                fontSize: 25,
                                opacity: isFocused ? 1 : 0.6,
                                transform: [{ scale: isFocused ? 1.1 : 1 }]
                            }}>
                                {icon}
                            </Text>
                            <Text style={{
                                color: isFocused ? '#AF52DE' : '#666',
                                fontSize: 11,
                                fontWeight: 'bold',
                                marginTop: 4,
                                textTransform: 'uppercase'
                            }}>
                                {route.name === 'Intel' ? 'VIAJE' :
                                    route.name === 'Radar' ? 'VUELOS' :
                                        route.name === 'Vault' ? 'DOCS' : 'PERFIL'}
                            </Text>
                        </TouchableOpacity>
                    );
                }
            })}
        >
            <Tab.Screen name="Intel" component={IntelScreen} />
            <Tab.Screen name="Radar" component={RadarScreen} />
            <Tab.Screen name="Vault" component={VaultScreen} />
            <Tab.Screen name="Bio" component={BioScreen} />
        </Tab.Navigator>
    );
}
