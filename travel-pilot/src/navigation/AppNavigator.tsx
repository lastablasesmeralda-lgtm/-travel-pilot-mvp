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
                    bottom: 45,
                    left: 15,
                    right: 15,
                    height: 85,
                    backgroundColor: 'rgba(3, 7, 18, 0.99)', // Más oscuro para que resalten los fluorescentes
                    borderRadius: 42,
                    borderTopWidth: 0,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 215, 0, 0.8)',
                    paddingBottom: 5,
                    paddingHorizontal: 15,
                    elevation: 25,
                    shadowColor: '#FFD700',
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.8, // Brillo mucho más intenso
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
                                backgroundColor: isFocused ? 'rgba(255, 215, 0, 0.25)' : 'transparent',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: isFocused ? 1.5 : 0,
                                borderColor: 'rgba(255, 255, 255, 0.6)'
                            }}>
                                <Text style={{
                                    fontSize: isFocused ? 30 : 22, // Aún más grande
                                    opacity: isFocused ? 1 : 0.4,
                                    transform: [{ scale: isFocused ? 1.2 : 1 }],
                                    textShadowColor: isFocused ? '#FFD700' : 'transparent',
                                    textShadowRadius: isFocused ? 15 : 0
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
                                color: isFocused ? '#FFFFFF' : 'rgba(255, 215, 0, 0.35)', // Máximo contraste
                                fontSize: 10, // Un pelín más grande para legibilidad
                                fontWeight: '900',
                                marginTop: 4,
                                textTransform: 'uppercase',
                                letterSpacing: isFocused ? 3 : 1,
                                textShadowColor: isFocused ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
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
