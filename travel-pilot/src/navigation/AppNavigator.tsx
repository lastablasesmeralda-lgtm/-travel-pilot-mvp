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
                    position: 'absolute',
                    bottom: 30,
                    left: 20,
                    right: 20,
                    height: 80,
                    backgroundColor: 'rgba(10, 25, 47, 0.98)',
                    borderRadius: 40,
                    borderTopWidth: 0,
                    borderWidth: 2,
                    borderColor: '#FFD700',
                    paddingBottom: 0,
                    paddingHorizontal: 15,
                    elevation: 20,
                    shadowColor: '#FFD700',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20
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
                            style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                            activeOpacity={0.7}
                        >
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: isFocused ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: isFocused ? 1 : 0,
                                borderColor: 'rgba(212, 175, 55, 0.5)'
                            }}>
                                <Text style={{
                                    fontSize: isFocused ? 26 : 22,
                                    opacity: isFocused ? 1 : 0.6,
                                    transform: [{ scale: isFocused ? 1.1 : 1 }],
                                    textShadowColor: isFocused ? 'rgba(212, 175, 55, 0.8)' : 'transparent',
                                    textShadowRadius: isFocused ? 10 : 0
                                }}>
                                    {icon}
                                </Text>
                                {route.name === 'Vault' && hasNewDoc && (
                                    <View style={{
                                        position: 'absolute',
                                        right: -2,
                                        top: -2,
                                        width: 12,
                                        height: 12,
                                        borderRadius: 6,
                                        backgroundColor: '#FF3B30',
                                        borderWidth: 2,
                                        borderColor: '#0C0F14'
                                    }} />
                                )}
                            </View>
                            <Text style={{
                                color: isFocused ? '#FFD700' : 'rgba(255, 215, 0, 0.4)',
                                fontSize: 9,
                                fontWeight: '900',
                                marginTop: 2,
                                textTransform: 'uppercase',
                                letterSpacing: isFocused ? 2 : 0.5,
                                textShadowColor: isFocused ? 'rgba(255, 215, 0, 0.8)' : 'transparent',
                                textShadowRadius: isFocused ? 10 : 0
                            }}>
                                {route.name === 'Intel' ? 'INICIO' :
                                    route.name === 'Radar' ? 'VUELOS' :
                                        route.name === 'Vault' ? 'DOCS' : 'PERFIL'}
                            </Text>
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
