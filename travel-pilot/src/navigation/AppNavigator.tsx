import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, Text } from 'react-native';
import { useAppContext } from '../context/AppContext';

import IntelScreen from '../screens/IntelScreen';
import VuelosScreen from '../screens/RadarScreen';
import DocsScreen from '../screens/VaultScreen';
import BioScreen from '../screens/BioScreen';
import { s } from '../styles';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
    const { hasNewDoc } = useAppContext();
    return (
        <Tab.Navigator
            id="AppTabs"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    height: 95,
                    backgroundColor: '#0F0F0F',
                    flexDirection: 'row',
                    borderTopWidth: 1,
                    borderColor: '#222',
                    paddingBottom: 25,
                    paddingHorizontal: 10
                },
                tabBarButton: (props) => {
                    let icon = '';
                    if (route.name === 'Intel') icon = '💠';
                    else if (route.name === 'Radar') icon = '✈️';
                    else if (route.name === 'Vault') icon = '💼';
                    else if (route.name === 'Bio') icon = '👥';

                    const isFocused = props.accessibilityState?.selected;

                    return (
                        <TouchableOpacity
                            {...(props as any)}
                            style={[s.ni, { flexDirection: 'column', alignItems: 'center' }]}
                        >
                            <View>
                                <Text style={{
                                    fontSize: 26,
                                    opacity: isFocused ? 1 : 0.5,
                                    transform: [{ scale: isFocused ? 1.2 : 1 }],
                                    textShadowColor: isFocused ? 'rgba(175, 82, 222, 0.8)' : 'transparent',
                                    textShadowRadius: isFocused ? 15 : 0
                                }}>
                                    {icon}
                                </Text>
                                {route.name === 'Vault' && hasNewDoc && (
                                    <View style={{
                                        position: 'absolute',
                                        right: -2,
                                        top: -2,
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: '#FF3B30',
                                        borderWidth: 1.5,
                                        borderColor: '#0F0F0F'
                                    }} />
                                )}
                            </View>
                            <Text style={{
                                color: isFocused ? '#AF52DE' : '#666',
                                fontSize: 10,
                                fontWeight: '900',
                                marginTop: 4,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5
                            }}>
                                {route.name === 'Intel' ? 'INICIO' :
                                    route.name === 'Radar' ? 'VUELOS' :
                                        route.name === 'Vault' ? 'DOCS' : 'PERFIL'}
                            </Text>
                            {isFocused && (
                                <View style={{ 
                                    width: 4, 
                                    height: 4, 
                                    borderRadius: 2, 
                                    backgroundColor: '#AF52DE', 
                                    marginTop: 4,
                                    shadowColor: '#AF52DE',
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 1,
                                    shadowRadius: 5
                                }} />
                            )}
                        </TouchableOpacity>
                    );
                }
            })}
        >
            <Tab.Screen name="Intel" component={IntelScreen} />
            <Tab.Screen name="Radar" component={VuelosScreen} />
            <Tab.Screen name="Vault" component={DocsScreen} />
            <Tab.Screen name="Bio" component={BioScreen} />
        </Tab.Navigator>
    );
}
