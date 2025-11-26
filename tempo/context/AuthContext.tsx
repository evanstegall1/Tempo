import React, {createContext, useContext, useEffect, useState} from 'react';
import {useRouter, useSegments} from 'expo-router';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType{
    signIn:(token:string)=> void;
    signOut:()=>void;
    session:string|null;
    isLoading:boolean;
}

const AuthContext=createContext<AuthContextType | undefined>(undefined);

export function useAuth(){
    const context=useContext(AuthContext);
    if(context===undefined){
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({children}:{children: React.ReactNode}){
    const [session, setSession]=useState<string | null>(null);
    const [isLoading, setIsLoading]=useState(true);

    useEffect(()=>{
        const loadSession = async()=>{
            try{
                const token =await SecureStore.getItemAsync('session_token');
                setSession(token);
            }catch (e){
                console.error('Failed to load session token:', e);
            }finally{
                setIsLoading(false);
            }
        };
        loadSession();
    },[]);

    const signIn=async (token: string)=>{
        try{
            await SecureStore.setItemAsync('session_token', token);
            setSession(token);
        }catch (e){
            console.error('Failed to save session token:', e);
        }
    };

    const signOut = async()=>{
        try{
            await SecureStore.deleteItemAsync('session_token');
            setSession(null);
        }catch (e){
            console.error('Failed to delete session token:', e);
        }
    };
    
    return(
        <AuthContext.Provider
        value={{
            signIn,
            signOut,
            session,
            isLoading,
        }}
        >
            {children}
        </AuthContext.Provider>
    );
}