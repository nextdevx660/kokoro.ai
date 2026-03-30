'use client'

import { useEffect, useState } from 'react';
import axios from 'axios';
import CharacterCard from '@/components/CharacterCard';
import { useAuth } from '@/context/AuthProvider';
import { getFirebaseAccessToken } from '@/lib/auth-client';
import ForYou from '@/components/ForYou';
import Demoness from '@/components/Demoness';
import Kitsune from '@/components/Kitsune';
import { set } from '@elevenlabs/elevenlabs-js/core/schemas';
import Oppai from '@/components/Oppai';
import CharacterHero from '@/components/CharacterHero';
import { useUser } from '@/context/UserContext';
import Scenes from '@/components/Scenes';
import { collection, doc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function HomePage() {
  const { userData, user } = useUser()
  const [allCharacters, setAllCharacters] = useState([]);
  const [forYou, setForYou] = useState([])
  const [demoness, setDemoness] = useState([])
  const [kitsune, setKitsune] = useState([])
  const [oppai, setOppai] = useState([])
  const [scene, setScene] = useState([])

  const getAllCharacters = async () => {
    try {
      const accessToken = await getFirebaseAccessToken();
      const headers = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined;
      const resp = await axios.get('/api/characters', { headers });
      setAllCharacters(resp.data);

      const sorted = resp.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const latest10 = sorted.slice(0, 10);
      setForYou(latest10);

      const demon = resp.data.filter((d) => {
        const tags = ['bdsm queen', 'bdmsqueen', 'bdsm', 'demoness'];

        const tagText = d.tag?.toLowerCase() || '';

        return tags.some(tag => tagText.includes(tag));
      });

      setDemoness(demon.slice(0, 10));

      const kit = resp.data.filter((d) => {
        const tags = ['kitsune', 'fox'];

        const tagText = d.tag?.toLowerCase() || '';

        return tags.some(tag => tagText.includes(tag));
      });

      setKitsune(kit.slice(0, 10));


      const opp = resp.data.filter((d) => {
        const tags = ['anal', 'oppai', 'boobs'];

        const tagText = d.tag?.toLowerCase() || '';

        return tags.some(tag => tagText.includes(tag));
      });

      setOppai(opp.slice(0, 10));



    } catch (error) {
      console.error('Failed to fetch characters:', error);
    }
  };


  useEffect(() => {
    getAllCharacters();
  }, [user]);


  // console.log(allCharacters);

  const getScene = async () => {
    try {
      // 1. Collection reference banayein
      const charactersRef = collection(db, 'characters');

      // 2. Query design karein (Modular style)
      const q = query(
        charactersRef,
        where('isScene', '==', true),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      // 3. getDocs ka use karein data lane ke liye
      const snapshot = await getDocs(q);

      const sceneData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setScene(sceneData);
    } catch (error) {
      console.error("Error fetching scenes: ", error);
    }
  };

  useEffect(() => {
    getScene();
  }, []);

  return (
    <div className='p-4 no-scrollbar'>
      <ForYou forYou={forYou} />
      <Scenes scene={scene} />
      <Demoness demoness={demoness} />
      <Kitsune kitsune={kitsune} />
      <Oppai oppai={oppai} />
      <CharacterHero />
    </div>
  );
}
