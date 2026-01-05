import React, { useState, useEffect } from 'react';
import { Plus, X, LogOut, Loader2, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';

const storage = {
  async get(key) {
    try {
      if (window.storage?.get) return await window.storage.get(key);
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    } catch (e) {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    }
  },
  async set(key, value) {
    try {
      if (window.storage?.set) return await window.storage.set(key, value);
      localStorage.setItem(key, value);
      return { value };
    } catch (e) {
      localStorage.setItem(key, value);
      return { value };
    }
  },
  async delete(key) {
    try {
      if (window.storage?.delete) return await window.storage.delete(key);
      localStorage.removeItem(key);
      return { deleted: true };
    } catch (e) {
      localStorage.removeItem(key);
      return { deleted: true };
    }
  }
};

export default function NutritionSENSApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', name: '' });
  const [subscription, setSubscription] = useState('free');
  const [loginError, setLoginError] = useState('');
  
  const [appMode, setAppMode] = useState(null);
  const [step, setStep] = useState(1);
  
  const [userProfile, setUserProfile] = useState({ 
    weight: '', age: '', gender: 'homme', height: '175',
    wakeTime: '06:30', sleepTime: '22:30',
    activityLevel: 'moderate'
  });
  const [goal, setGoal] = useState('');
  
  const [workSchedule, setWorkSchedule] = useState({
    hasWork: true,
    blocks: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }]
  });
  
  const [planningPrefs, setPlanningPrefs] = useState({
    allowDoubles: false,
    spread: 'étaler',
    longRunDay: 'Samedi'
  });
  
  const [dayPrefs, setDayPrefs] = useState({
    Lundi: { matin: false, midi: false, soir: true },
    Mardi: { matin: false, midi: false, soir: true },
    Mercredi: { matin: false, midi: false, soir: true },
    Jeudi: { matin: false, midi: false, soir: true },
    Vendredi: { matin: false, midi: false, soir: true },
    Samedi: { matin: true, midi: true, soir: false },
    Dimanche: { matin: true, midi: false, soir: false }
  });
  
  const [wantedSessions, setWantedSessions] = useState([]);
  const [currentWantedSession, setCurrentWantedSession] = useState({
    type: '', duration: '', intensity: 'modérée', count: 1
  });
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  
  const [nutritionPrefs, setNutritionPrefs] = useState({
    snacks: true,
    mealsCount: '3-4'
  });
  
  const [equipment, setEquipment] = useState({
    four: true, microOndes: true, poele: true, casserole: true,
    grilleViande: false, grillePain: true, blender: false, cuiseur: false, airFryer: false
  });
  
  const equipmentList = [
    { id: 'four', label: 'Four', icon: '🔥' },
    { id: 'microOndes', label: 'Micro-ondes', icon: '📡' },
    { id: 'poele', label: 'Poêle', icon: '🍳' },
    { id: 'casserole', label: 'Casserole', icon: '🥘' },
    { id: 'grilleViande', label: 'Grill', icon: '🥩' },
    { id: 'grillePain', label: 'Grille-pain', icon: '🍞' },
    { id: 'blender', label: 'Blender', icon: '🥤' },
    { id: 'cuiseur', label: 'Cuiseur', icon: '🍚' },
    { id: 'airFryer', label: 'Air Fryer', icon: '🌀' }
  ];
  
  const [activities, setActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState({ type: '', duration: '', intensity: '', time: '' });
  const [showActivityForm, setShowActivityForm] = useState(false);
  
  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '' });
  
  const [timeline, setTimeline] = useState(null);
  const [calorieBreakdown, setCalorieBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const timeSlots = [
    { id: 'matin', label: 'Matin', icon: '☀️' },
    { id: 'midi', label: 'Midi', icon: '🌤️' },
    { id: 'soir', label: 'Soir', icon: '🌙' }
  ];
  
  const sessionTypes = [
    { name: 'Course à pied', icon: '🏃', defaultDuration: 60 },
    { name: 'Vélo', icon: '🚴', defaultDuration: 90 },
    { name: 'Natation', icon: '🏊', defaultDuration: 60 },
    { name: 'Musculation', icon: '🏋️', defaultDuration: 60 },
    { name: 'HIIT/CrossFit', icon: '💪', defaultDuration: 45 },
    { name: 'Yoga/Stretching', icon: '🧘', defaultDuration: 45 },
    { name: 'Marche', icon: '🚶', defaultDuration: 60 },
    { name: 'Sports collectifs', icon: '⚽', defaultDuration: 90 }
  ];

  const intensities = [
    { id: 'légère', label: 'Légère', score: 1 },
    { id: 'modérée', label: 'Modérée', score: 2 },
    { id: 'intense', label: 'Intense', score: 3 }
  ];

  const goals = [
    { id: '', label: 'Aucun objectif' },
    { id: 'Santé générale', label: 'Santé / Forme' },
    { id: 'Performance', label: 'Performance' },
    { id: 'Perte de poids', label: 'Perte de poids' },
    { id: 'Prise de muscle', label: 'Prise de muscle' }
  ];

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const userData = await storage.get('sens-user-v9');
      if (userData?.value) {
        const u = JSON.parse(userData.value);
        setUser(u);
        setIsLoggedIn(true);
        setSubscription(u.subscription || 'free');
      }
    } catch (err) {}
  };

  const handleRegister = async () => {
    setLoginError('');
    if (!loginForm.email || !loginForm.password || !loginForm.name) {
      setLoginError('Merci de remplir tous les champs');
      return;
    }
    try {
      const newUser = {
        id: Date.now(),
        name: loginForm.name,
        email: loginForm.email.toLowerCase().trim(),
        password: loginForm.password,
        subscription: 'premium',
        createdAt: new Date().toISOString()
      };
      await storage.set(`sens-account-v9-${newUser.email}`, JSON.stringify(newUser));
      await storage.set('sens-user-v9', JSON.stringify(newUser));
      setUser(newUser);
      setIsLoggedIn(true);
      setSubscription('premium');
    } catch (err) {
      setLoginError('Erreur lors de la création du compte');
    }
  };

  const handleLogin = async () => {
    setLoginError('');
    if (!loginForm.email || !loginForm.password) {
      setLoginError('Merci de remplir tous les champs');
      return;
    }
    try {
      const email = loginForm.email.toLowerCase().trim();
      const userData = await storage.get(`sens-account-v9-${email}`);
      if (!userData?.value) {
        setLoginError('Compte introuvable');
        return;
      }
      const u = JSON.parse(userData.value);
      if (u.password !== loginForm.password) {
        setLoginError('Mot de passe incorrect');
        return;
      }
      await storage.set('sens-user-v9', JSON.stringify(u));
      setUser(u);
      setIsLoggedIn(true);
      setSubscription(u.subscription || 'free');
    } catch (err) {
      setLoginError('Erreur de connexion');
    }
  };

  const handleLogout = async () => {
    await storage.delete('sens-user-v9');
    setUser(null);
    setIsLoggedIn(false);
    setAppMode(null);
    setStep(1);
  };

  const toggleDaySlot = (day, slot) => {
    setDayPrefs({
      ...dayPrefs,
      [day]: { ...dayPrefs[day], [slot]: !dayPrefs[day][slot] }
    });
  };

  // === PLANIFICATION ===
  const addWantedSession = () => {
    if (currentWantedSession.type && currentWantedSession.duration) {
      const sessions = [];
      for (let i = 0; i < currentWantedSession.count; i++) {
        sessions.push({
          id: Date.now() + i,
          type: currentWantedSession.type,
          duration: parseInt(currentWantedSession.duration),
          intensity: currentWantedSession.intensity,
          icon: sessionTypes.find(s => s.name === currentWantedSession.type)?.icon || '🏃'
        });
      }
      setWantedSessions([...wantedSessions, ...sessions]);
      setCurrentWantedSession({ type: '', duration: '', intensity: 'modérée', count: 1 });
    }
  };

  const removeWantedSession = (id) => {
    setWantedSessions(wantedSessions.filter(s => s.id !== id));
  };

  const addWorkBlock = () => {
    setWorkSchedule({
      ...workSchedule,
      blocks: [...workSchedule.blocks, { start: '09:00', end: '12:00' }]
    });
  };

  const removeWorkBlock = (index) => {
    setWorkSchedule({
      ...workSchedule,
      blocks: workSchedule.blocks.filter((_, i) => i !== index)
    });
  };

  const updateWorkBlock = (index, field, value) => {
    const newBlocks = [...workSchedule.blocks];
    newBlocks[index][field] = value;
    setWorkSchedule({ ...workSchedule, blocks: newBlocks });
  };

  const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getAvailableSlots = (dayIndex) => {
    const isWeekend = dayIndex >= 5;
    const wake = timeToMinutes(userProfile.wakeTime);
    const sleep = timeToMinutes(userProfile.sleepTime);
    
    if (!workSchedule.hasWork || isWeekend) {
      const midDay = wake + Math.floor((sleep - wake) / 2);
      return [
        { start: wake + 15, end: wake + 180, label: 'matin', displayLabel: 'Matin' },
        { start: midDay - 60, end: midDay + 60, label: 'midi', displayLabel: 'Midi' },
        { start: sleep - 180, end: sleep - 30, label: 'soir', displayLabel: 'Soir' }
      ];
    }
    
    const slots = [];
    const sortedBlocks = [...workSchedule.blocks].sort((a, b) => 
      timeToMinutes(a.start) - timeToMinutes(b.start)
    );
    
    if (sortedBlocks.length > 0) {
      const firstBlockStart = timeToMinutes(sortedBlocks[0].start);
      if (firstBlockStart - wake >= 45) {
        slots.push({ start: wake + 15, end: firstBlockStart - 15, label: 'matin', displayLabel: 'Matin' });
      }
    }
    
    for (let i = 0; i < sortedBlocks.length - 1; i++) {
      const endCurrent = timeToMinutes(sortedBlocks[i].end);
      const startNext = timeToMinutes(sortedBlocks[i + 1].start);
      if (startNext - endCurrent >= 45) {
        slots.push({ start: endCurrent + 10, end: startNext - 10, label: 'midi', displayLabel: 'Midi' });
      }
    }
    
    if (sortedBlocks.length > 0) {
      const lastBlockEnd = timeToMinutes(sortedBlocks[sortedBlocks.length - 1].end);
      if (sleep - lastBlockEnd >= 60) {
        slots.push({ start: lastBlockEnd + 15, end: sleep - 30, label: 'soir', displayLabel: 'Soir' });
      }
    }
    
    return slots;
  };

  const generateSchedule = () => {
    if (wantedSessions.length === 0) return;
    
    const sortedSessions = [...wantedSessions].sort((a, b) => {
      if (b.duration !== a.duration) return b.duration - a.duration;
      const scoreA = intensities.find(i => i.id === a.intensity)?.score || 2;
      const scoreB = intensities.find(i => i.id === b.intensity)?.score || 2;
      return scoreB - scoreA;
    });
    
    const longestSession = sortedSessions[0];
    const longDayIndex = days.indexOf(planningPrefs.longRunDay);
    
    const schedule = days.map((day, idx) => ({
      day,
      dayIndex: idx,
      isWeekend: idx >= 5,
      slots: getAvailableSlots(idx),
      sessions: [],
      preferredSlots: dayPrefs[day]
    }));
    
    const lastIntenseByType = {};
    
    if (longestSession && longestSession.duration >= 90) {
      const longDay = schedule[longDayIndex];
      const preferredSlotLabels = Object.entries(longDay.preferredSlots)
        .filter(([_, v]) => v).map(([k]) => k);
      
      let bestSlot = longDay.slots.find(s => 
        preferredSlotLabels.includes(s.label) && (s.end - s.start) >= longestSession.duration
      );
      if (!bestSlot) {
        bestSlot = longDay.slots.find(s => (s.end - s.start) >= longestSession.duration);
      }
      
      if (bestSlot) {
        longDay.sessions.push({
          ...longestSession,
          startTime: minutesToTime(bestSlot.start),
          endTime: minutesToTime(bestSlot.start + longestSession.duration),
          slotLabel: bestSlot.displayLabel
        });
        if (longestSession.intensity === 'intense') {
          lastIntenseByType[longestSession.type] = longDayIndex;
        }
        sortedSessions.shift();
      }
    }
    
    let dayOrder = [...schedule];
    if (planningPrefs.spread === 'étaler') {
      dayOrder = schedule.filter((_, i) => i % 2 === 0).concat(schedule.filter((_, i) => i % 2 === 1));
    }
    
    for (const session of sortedSessions) {
      const isIntense = session.intensity === 'intense';
      let placed = false;
      
      for (const day of dayOrder) {
        if (placed) break;
        
        const sportsInDay = day.sessions.map(s => s.type);
        if (sportsInDay.includes(session.type)) continue;
        if (!planningPrefs.allowDoubles && day.sessions.length >= 1) continue;
        if (planningPrefs.allowDoubles && day.sessions.length >= 3) continue;
        
        const hasIntenseToday = day.sessions.some(s => s.intensity === 'intense');
        if (isIntense && hasIntenseToday) continue;
        
        if (isIntense && lastIntenseByType[session.type] !== undefined) {
          const daysSinceLastIntense = Math.abs(day.dayIndex - lastIntenseByType[session.type]);
          if (daysSinceLastIntense < 2) continue;
        }
        
        const preferredSlotLabels = Object.entries(day.preferredSlots)
          .filter(([_, v]) => v).map(([k]) => k);
        
        const slotsToTry = preferredSlotLabels.length > 0
          ? [...day.slots.filter(s => preferredSlotLabels.includes(s.label)), ...day.slots.filter(s => !preferredSlotLabels.includes(s.label))]
          : day.slots;
        
        for (const slot of slotsToTry) {
          const slotDuration = slot.end - slot.start;
          const usedTime = day.sessions
            .filter(s => s.slotLabel === slot.displayLabel)
            .reduce((sum, s) => sum + s.duration + 15, 0);
          
          if (slotDuration - usedTime >= session.duration) {
            let startTime = slot.start;
            const sessionsInSlot = day.sessions.filter(s => s.slotLabel === slot.displayLabel);
            if (sessionsInSlot.length > 0) {
              const lastEnd = Math.max(...sessionsInSlot.map(s => 
                timeToMinutes(s.startTime) + s.duration
              ));
              startTime = lastEnd + 15;
            }
            
            day.sessions.push({
              ...session,
              startTime: minutesToTime(startTime),
              endTime: minutesToTime(startTime + session.duration),
              slotLabel: slot.displayLabel
            });
            
            if (isIntense) lastIntenseByType[session.type] = day.dayIndex;
            placed = true;
            break;
          }
        }
      }
    }
    
    schedule.forEach(day => {
      day.sessions.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    });
    
    setGeneratedSchedule(schedule);
    setStep(5);
  };

  // === NUTRITION ===
  const addIngredient = () => {
    if (newIngredient.name.trim()) {
      setIngredients([...ingredients, {
        name: newIngredient.name.trim(),
        quantity: newIngredient.quantity.trim() || ''
      }]);
      setNewIngredient({ name: '', quantity: '' });
    }
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const toggleEquipment = (id) => {
    setEquipment({ ...equipment, [id]: !equipment[id] });
  };

  const calculateCalories = () => {
    const weight = parseFloat(userProfile.weight) || 70;
    const height = parseFloat(userProfile.height) || 175;
    const age = parseFloat(userProfile.age) || 30;
    
    let bmr = userProfile.gender === 'homme' 
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
    
    const dailyActivityMultiplier = 1.4;
    const tdeeBase = Math.round(bmr * dailyActivityMultiplier);
    
    const trainingCalories = activities.reduce((sum, a) => {
      const duration = parseInt(a.duration) || 0;
      const intensity = a.intensity?.toLowerCase() || '';
      let calPerMin = 8;
      if (intensity.includes('intense')) calPerMin = 12;
      else if (intensity.includes('modér')) calPerMin = 9;
      else if (intensity.includes('légère')) calPerMin = 6;
      return sum + (duration * calPerMin);
    }, 0);
    
    let total = tdeeBase + trainingCalories;
    let adjustment = 0;
    
    if (goal === 'Perte de poids') adjustment = -Math.round(total * 0.15);
    else if (goal === 'Prise de muscle') adjustment = Math.round(total * 0.10);
    
    return {
      bmr: Math.round(bmr),
      tdeeBase,
      trainingCalories: Math.round(trainingCalories),
      total: total + adjustment,
      adjustment,
      details: { weight, height, age, gender: userProfile.gender }
    };
  };

  const addActivity = () => {
    if (currentActivity.type && currentActivity.duration && currentActivity.time) {
      setActivities([...activities, { ...currentActivity, id: Date.now() }]);
      setCurrentActivity({ type: '', duration: '', intensity: '', time: '' });
      setShowActivityForm(false);
    }
  };

  const generateTimeline = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    
    try {
      const cal = calculateCalories();
      setCalorieBreakdown(cal);

      let trainingContext = 'Repos';
      if (activities.length > 0) {
        trainingContext = activities.map(a => `${a.time} ${a.type} ${a.duration}min (${a.intensity})`).join(', ');
      }

      const ingredientsList = ingredients.map(i => 
        i.quantity ? `${i.name} (${i.quantity})` : i.name
      ).join(', ');

      const availableEquipment = equipmentList
        .filter(e => equipment[e.id]).map(e => e.label).join(', ');

      let snackRules = nutritionPrefs.snacks 
        ? `COLLATIONS: Max 1-2/jour, uniquement si séance intense >60min et repas >2h30 avant. Pas de collation soir = dessert au dîner.`
        : 'PAS de collations.';

      const prompt = `Nutritionniste sportif. Plan repas intelligent.

PROFIL: ${userProfile.gender}, ${cal.details.weight}kg, ${cal.details.height}cm, ${cal.details.age}ans
CALORIES: Base ${cal.tdeeBase} + Sport ${cal.trainingCalories} = ${cal.total} kcal
OBJECTIF: ${goal || 'Santé'}
HORAIRES: ${userProfile.wakeTime} - ${userProfile.sleepTime}
SPORT: ${trainingContext}
REPAS: ${nutritionPrefs.mealsCount}
${snackRules}
ÉQUIPEMENTS: ${availableEquipment}
INGRÉDIENTS: ${ingredientsList}

JSON uniquement:
{"meals":[{"time":"07:00","name":"Petit-déjeuner","intention":"Énergie","recipe":{"name":"Recette","ingredients":["Aliment 100g"],"cooking":"Poêle","steps":"Préparation"},"kcal":500,"tips":"Conseil"}],"shopping":["Aliment"],"hydration":"2L eau","summary":"Résumé"}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2500,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) throw new Error(`Erreur API (${response.status})`);
      
      const data = await response.json();
      if (!data.content?.[0]?.text) throw new Error('Réponse invalide');
      
      let text = data.content[0].text;
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      if (jsonStart === -1) throw new Error('JSON non trouvé');
      
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));
      if (!parsed.meals) throw new Error('Format invalide');
      
      setTimeline(parsed);
      setStep(6);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === STYLES ===
  const colors = {
    bg: '#FAFAF9',
    card: '#FFFFFF',
    primary: '#4A7C59',
    primaryLight: '#E8F0EA',
    secondary: '#8B7355',
    secondaryLight: '#F5F0EB',
    text: '#2D2D2D',
    textLight: '#6B6B6B',
    border: '#E5E5E5',
    accent: '#D4A574'
  };

  // === COMPOSANTS ===
  const Logo = () => (
    <div className="text-center">
      <div className="inline-flex items-center gap-1 text-2xl font-light tracking-wider" style={{ color: colors.primary }}>
        <span className="font-semibold">S</span>
        <span className="text-sm" style={{ color: colors.textLight }}>anté</span>
        <span className="font-semibold">E</span>
        <span className="text-sm" style={{ color: colors.textLight }}>motions</span>
        <span className="font-semibold">N</span>
        <span className="text-sm" style={{ color: colors.textLight }}>utrition</span>
        <span className="font-semibold">S</span>
        <span className="text-sm" style={{ color: colors.textLight }}>tructuration</span>
      </div>
      <p className="text-xs mt-1 italic" style={{ color: colors.textLight }}>Le sport en pleine conscience</p>
    </div>
  );

  const Card = ({ children, className = '', onClick }) => (
    <div 
      className={`bg-white rounded-2xl p-6 shadow-sm border ${className}`} 
      style={{ borderColor: colors.border }}
      onClick={onClick}
    >
      {children}
    </div>
  );

  const Button = ({ children, variant = 'primary', disabled, onClick, className = '' }) => {
    const styles = {
      primary: { backgroundColor: colors.primary, color: 'white' },
      secondary: { backgroundColor: colors.secondaryLight, color: colors.secondary },
      outline: { backgroundColor: 'transparent', border: `1px solid ${colors.border}`, color: colors.text }
    };
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'} ${className}`}
        style={styles[variant]}
      >
        {children}
      </button>
    );
  };

  const Input = ({ label, ...props }) => (
    <div>
      {label && <label className="text-xs font-medium block mb-1.5" style={{ color: colors.textLight }}>{label}</label>}
      <input
        {...props}
        className="w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2"
        style={{ 
          borderColor: colors.border, 
          backgroundColor: colors.bg,
          '--tw-ring-color': colors.primaryLight 
        }}
      />
    </div>
  );

  const Select = ({ label, children, ...props }) => (
    <div>
      {label && <label className="text-xs font-medium block mb-1.5" style={{ color: colors.textLight }}>{label}</label>}
      <select
        {...props}
        className="w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none"
        style={{ borderColor: colors.border, backgroundColor: colors.bg }}
      >
        {children}
      </select>
    </div>
  );

  const StepIndicator = ({ current, total }) => (
    <div className="flex justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${i < current ? 'w-8' : 'w-3'}`}
          style={{ backgroundColor: i < current ? colors.primary : colors.border }}
        />
      ))}
    </div>
  );

  const SectionTitle = ({ children, subtitle }) => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold" style={{ color: colors.text }}>{children}</h2>
      {subtitle && <p className="text-sm mt-1" style={{ color: colors.textLight }}>{subtitle}</p>}
    </div>
  );

  // === ÉCRANS ===
  
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-md w-full">
          <Card>
            <div className="mb-8">
              <Logo />
            </div>

            <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ backgroundColor: colors.bg }}>
              <button 
                onClick={() => setShowLogin(true)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all`}
                style={{ 
                  backgroundColor: showLogin ? 'white' : 'transparent',
                  color: showLogin ? colors.primary : colors.textLight,
                  boxShadow: showLogin ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Connexion
              </button>
              <button 
                onClick={() => setShowLogin(false)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all`}
                style={{ 
                  backgroundColor: !showLogin ? 'white' : 'transparent',
                  color: !showLogin ? colors.primary : colors.textLight,
                  boxShadow: !showLogin ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Inscription
              </button>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl mb-4 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                {loginError}
              </div>
            )}

            <div className="space-y-4">
              {!showLogin && <Input type="text" placeholder="Prénom" value={loginForm.name}
                onChange={(e) => setLoginForm({...loginForm, name: e.target.value})} />}
              <Input type="email" placeholder="Email" value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} />
              <Input type="password" placeholder="Mot de passe" value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && (showLogin ? handleLogin() : handleRegister())} />
              <Button onClick={showLogin ? handleLogin : handleRegister} className="w-full">
                {showLogin ? 'Se connecter' : 'Créer mon compte'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Menu principal
  if (!appMode) {
    return (
      <div className="min-h-screen p-4" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-lg mx-auto pt-8">
          <div className="text-center mb-8">
            <Logo />
            <p className="mt-4 text-lg" style={{ color: colors.text }}>
              Bonjour <span className="font-semibold">{user?.name}</span>
            </p>
          </div>

          <div className="space-y-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setAppMode('planning')}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">📅</span>
                    <h2 className="text-lg font-semibold" style={{ color: colors.text }}>Structuration</h2>
                  </div>
                  <p className="text-sm" style={{ color: colors.textLight }}>
                    Organise ta semaine d'entraînement
                  </p>
                </div>
                <ChevronRight size={24} style={{ color: colors.textLight }} />
              </div>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setAppMode('nutrition')}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🍽️</span>
                    <h2 className="text-lg font-semibold" style={{ color: colors.text }}>Nutrition</h2>
                  </div>
                  <p className="text-sm" style={{ color: colors.textLight }}>
                    Planifie ton alimentation du jour
                  </p>
                </div>
                <ChevronRight size={24} style={{ color: colors.textLight }} />
              </div>
            </Card>
          </div>

          <button onClick={handleLogout} className="mx-auto block mt-8 text-sm" style={{ color: colors.textLight }}>
            <LogOut size={16} className="inline mr-2" />Déconnexion
          </button>
        </div>
      </div>
    );
  }

  // === PLANIFICATION ===
  if (appMode === 'planning') {
    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 px-4 py-4" style={{ backgroundColor: colors.bg }}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { setAppMode(null); setStep(1); setGeneratedSchedule(null); setWantedSessions([]); }}
                className="flex items-center gap-1 text-sm" style={{ color: colors.textLight }}>
                <ChevronLeft size={20} /> Retour
              </button>
              <span className="text-sm font-medium" style={{ color: colors.primary }}>Structuration</span>
              <div className="w-16"></div>
            </div>
            {step < 5 && <StepIndicator current={step} total={4} />}
          </div>

          <div className="px-4">
            {step === 1 && (
              <div className="space-y-6">
                <Card>
                  <SectionTitle subtitle="Définis tes disponibilités">Tes horaires</SectionTitle>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Input label="Réveil" type="time" value={userProfile.wakeTime}
                      onChange={(e) => setUserProfile({...userProfile, wakeTime: e.target.value})} />
                    <Input label="Coucher" type="time" value={userProfile.sleepTime}
                      onChange={(e) => setUserProfile({...userProfile, sleepTime: e.target.value})} />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl" style={{ backgroundColor: colors.bg }}>
                    <input type="checkbox" checked={workSchedule.hasWork}
                      onChange={(e) => setWorkSchedule({...workSchedule, hasWork: e.target.checked})}
                      className="w-5 h-5 rounded" style={{ accentColor: colors.primary }} />
                    <span className="text-sm" style={{ color: colors.text }}>J'ai des horaires de travail fixes</span>
                  </label>

                  {workSchedule.hasWork && (
                    <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.bg }}>
                      <p className="text-xs mb-3" style={{ color: colors.textLight }}>Créneaux indisponibles :</p>
                      {workSchedule.blocks.map((block, idx) => (
                        <div key={idx} className="flex items-center gap-2 mb-2">
                          <input type="time" value={block.start}
                            onChange={(e) => updateWorkBlock(idx, 'start', e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: colors.border }} />
                          <span style={{ color: colors.textLight }}>→</span>
                          <input type="time" value={block.end}
                            onChange={(e) => updateWorkBlock(idx, 'end', e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: colors.border }} />
                          {workSchedule.blocks.length > 1 && (
                            <button onClick={() => removeWorkBlock(idx)} style={{ color: '#EF4444' }}><X size={18} /></button>
                          )}
                        </div>
                      ))}
                      <button onClick={addWorkBlock}
                        className="w-full py-2 mt-2 border-2 border-dashed rounded-lg text-sm"
                        style={{ borderColor: colors.border, color: colors.textLight }}>
                        + Ajouter un créneau
                      </button>
                    </div>
                  )}
                </Card>

                <Button onClick={() => setStep(2)} className="w-full">Continuer</Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <Card>
                  <SectionTitle subtitle="Quand préfères-tu t'entraîner ?">Créneaux préférés</SectionTitle>
                  
                  <div className="space-y-2">
                    {days.map(day => (
                      <div key={day} className="flex items-center gap-3">
                        <span className="w-10 text-sm font-medium" style={{ color: colors.text }}>{day.slice(0, 3)}</span>
                        <div className="flex-1 flex gap-1">
                          {timeSlots.map(slot => (
                            <button key={slot.id}
                              onClick={() => toggleDaySlot(day, slot.id)}
                              className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-all"
                              style={{ 
                                backgroundColor: dayPrefs[day][slot.id] ? colors.primary : colors.bg,
                                color: dayPrefs[day][slot.id] ? 'white' : colors.textLight
                              }}>
                              {slot.icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <SectionTitle>Options</SectionTitle>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {['étaler', 'condenser'].map(opt => (
                      <button key={opt} onClick={() => setPlanningPrefs({...planningPrefs, spread: opt})}
                        className="p-4 rounded-xl text-sm font-medium transition-all border-2"
                        style={{ 
                          borderColor: planningPrefs.spread === opt ? colors.primary : colors.border,
                          backgroundColor: planningPrefs.spread === opt ? colors.primaryLight : 'white',
                          color: colors.text
                        }}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl mb-4" style={{ backgroundColor: colors.secondaryLight }}>
                    <input type="checkbox" checked={planningPrefs.allowDoubles}
                      onChange={(e) => setPlanningPrefs({...planningPrefs, allowDoubles: e.target.checked})}
                      className="w-5 h-5 rounded" style={{ accentColor: colors.secondary }} />
                    <div>
                      <span className="text-sm font-medium" style={{ color: colors.secondary }}>Mode Triathlon</span>
                      <p className="text-xs" style={{ color: colors.textLight }}>Jusqu'à 3 sports différents par jour</p>
                    </div>
                  </label>

                  <div>
                    <label className="text-xs font-medium block mb-2" style={{ color: colors.textLight }}>Jour sortie longue</label>
                    <div className="flex flex-wrap gap-2">
                      {days.map(day => (
                        <button key={day} onClick={() => setPlanningPrefs({...planningPrefs, longRunDay: day})}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ 
                            backgroundColor: planningPrefs.longRunDay === day ? colors.primary : colors.bg,
                            color: planningPrefs.longRunDay === day ? 'white' : colors.textLight
                          }}>
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Retour</Button>
                  <Button onClick={() => setStep(3)} className="flex-1">Continuer</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <Card>
                  <SectionTitle subtitle="Que veux-tu faire cette semaine ?">Tes séances</SectionTitle>

                  {wantedSessions.length > 0 && (
                    <div className="space-y-2 mb-6">
                      {wantedSessions.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: colors.bg }}>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{s.icon}</span>
                            <div>
                              <div className="text-sm font-medium" style={{ color: colors.text }}>{s.type}</div>
                              <div className="text-xs" style={{ color: colors.textLight }}>{s.duration}min · {s.intensity}</div>
                            </div>
                          </div>
                          <button onClick={() => removeWantedSession(s.id)} style={{ color: '#EF4444' }}><X size={18} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 rounded-xl" style={{ backgroundColor: colors.primaryLight }}>
                    <Select value={currentWantedSession.type}
                      onChange={(e) => {
                        const type = sessionTypes.find(s => s.name === e.target.value);
                        setCurrentWantedSession({
                          ...currentWantedSession, type: e.target.value,
                          duration: type?.defaultDuration || 60
                        });
                      }}>
                      <option value="">Choisir une activité...</option>
                      {sessionTypes.map(t => (<option key={t.name} value={t.name}>{t.icon} {t.name}</option>))}
                    </Select>

                    {currentWantedSession.type && (
                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <Input label="Durée (min)" type="number" value={currentWantedSession.duration}
                            onChange={(e) => setCurrentWantedSession({...currentWantedSession, duration: e.target.value})} />
                          <Input label="Combien ?" type="number" min="1" max="10" value={currentWantedSession.count}
                            onChange={(e) => setCurrentWantedSession({...currentWantedSession, count: parseInt(e.target.value) || 1})} />
                        </div>

                        <div>
                          <label className="text-xs font-medium block mb-2" style={{ color: colors.textLight }}>Intensité</label>
                          <div className="flex gap-2">
                            {intensities.map(i => (
                              <button key={i.id} onClick={() => setCurrentWantedSession({...currentWantedSession, intensity: i.id})}
                                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                                style={{ 
                                  backgroundColor: currentWantedSession.intensity === i.id ? colors.primary : 'white',
                                  color: currentWantedSession.intensity === i.id ? 'white' : colors.text
                                }}>
                                {i.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Button onClick={addWantedSession} className="w-full">+ Ajouter</Button>
                      </div>
                    )}
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Retour</Button>
                  <Button onClick={() => setStep(4)} disabled={wantedSessions.length === 0} className="flex-1">Continuer</Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <Card>
                  <SectionTitle>Récapitulatif</SectionTitle>
                  
                  <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: colors.primaryLight }}>
                    <div className="text-2xl font-semibold mb-1" style={{ color: colors.primary }}>{wantedSessions.length} séances</div>
                    <div className="text-sm" style={{ color: colors.textLight }}>
                      dont {wantedSessions.filter(s => s.intensity === 'intense').length} intense(s)
                    </div>
                  </div>

                  <div className="space-y-2 text-sm" style={{ color: colors.textLight }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: colors.primary }}>✓</span> Pas de même sport 2x le même jour
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: colors.primary }}>✓</span> Maximum 1 séance intense par jour
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: colors.primary }}>✓</span> 2 jours entre 2 intenses du même sport
                    </div>
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Modifier</Button>
                  <Button onClick={generateSchedule} className="flex-1">Générer</Button>
                </div>
              </div>
            )}

            {step === 5 && generatedSchedule && (
              <div className="space-y-6">
                <Card>
                  <div className="flex justify-between items-center mb-6">
                    <SectionTitle>Ton planning</SectionTitle>
                    <button onClick={generateSchedule} style={{ color: colors.primary }}>
                      <RefreshCw size={20} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {generatedSchedule.map(day => (
                      <div key={day.day} className="p-4 rounded-xl" style={{ backgroundColor: day.sessions.length > 0 ? colors.primaryLight : colors.bg }}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium" style={{ color: colors.text }}>{day.day}</span>
                          {day.sessions.length > 1 && (
                            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: colors.secondary, color: 'white' }}>
                              {day.sessions.length} séances
                            </span>
                          )}
                        </div>
                        
                        {day.sessions.length > 0 ? (
                          <div className="space-y-2">
                            {day.sessions.map((s, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white">
                                <span className="text-2xl">{s.icon}</span>
                                <div className="flex-1">
                                  <div className="font-medium text-sm" style={{ color: colors.text }}>{s.type}</div>
                                  <div className="text-xs" style={{ color: colors.textLight }}>
                                    {s.startTime} - {s.endTime} · {s.slotLabel}
                                  </div>
                                  <div className="text-xs" style={{ color: s.intensity === 'intense' ? '#EF4444' : colors.primary }}>
                                    {s.duration}min · {s.intensity}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm italic" style={{ color: colors.textLight }}>Repos</div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                <Button variant="secondary" onClick={() => { setStep(1); setWantedSessions([]); setGeneratedSchedule(null); }} className="w-full">
                  Nouveau planning
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === NUTRITION ===
  if (appMode === 'nutrition') {
    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: colors.bg }}>
        {loading && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Card className="text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: colors.primary }} />
              <p style={{ color: colors.text }}>Création de ton plan...</p>
              <p className="text-xs mt-1" style={{ color: colors.textLight }}>Quelques secondes</p>
            </Card>
          </div>
        )}
        
        <div className="max-w-lg mx-auto">
          <div className="sticky top-0 z-10 px-4 py-4" style={{ backgroundColor: colors.bg }}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { setAppMode(null); setStep(1); setTimeline(null); setActivities([]); setIngredients([]); setError(''); }}
                className="flex items-center gap-1 text-sm" style={{ color: colors.textLight }}>
                <ChevronLeft size={20} /> Retour
              </button>
              <span className="text-sm font-medium" style={{ color: colors.primary }}>Nutrition</span>
              <div className="w-16"></div>
            </div>
            {step < 6 && <StepIndicator current={step} total={5} />}
          </div>

          <div className="px-4">
            {step === 1 && (
              <div className="space-y-6">
                <Card>
                  <SectionTitle subtitle="Pour calculer tes besoins">Ton profil</SectionTitle>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <Input label="Poids (kg)" type="number" placeholder="70" value={userProfile.weight}
                      onChange={(e) => setUserProfile({...userProfile, weight: e.target.value})} />
                    <Input label="Taille (cm)" type="number" placeholder="175" value={userProfile.height}
                      onChange={(e) => setUserProfile({...userProfile, height: e.target.value})} />
                    <Input label="Âge" type="number" placeholder="30" value={userProfile.age}
                      onChange={(e) => setUserProfile({...userProfile, age: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Select label="Sexe" value={userProfile.gender}
                      onChange={(e) => setUserProfile({...userProfile, gender: e.target.value})}>
                      <option value="homme">Homme</option>
                      <option value="femme">Femme</option>
                    </Select>
                    <Select label="Objectif" value={goal} onChange={(e) => setGoal(e.target.value)}>
                      {goals.map(g => (<option key={g.id} value={g.id}>{g.label}</option>))}
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Réveil" type="time" value={userProfile.wakeTime}
                      onChange={(e) => setUserProfile({...userProfile, wakeTime: e.target.value})} />
                    <Input label="Coucher" type="time" value={userProfile.sleepTime}
                      onChange={(e) => setUserProfile({...userProfile, sleepTime: e.target.value})} />
                  </div>
                </Card>

                <Card>
                  <SectionTitle>Préférences repas</SectionTitle>
                  
                  <div className="flex gap-2 mb-4">
                    {['3', '3-4', '4-5'].map(n => (
                      <button key={n} onClick={() => setNutritionPrefs({...nutritionPrefs, mealsCount: n})}
                        className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                        style={{ 
                          backgroundColor: nutritionPrefs.mealsCount === n ? colors.primary : colors.bg,
                          color: nutritionPrefs.mealsCount === n ? 'white' : colors.text
                        }}>
                        {n} repas
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl" style={{ backgroundColor: colors.bg }}>
                    <input type="checkbox" checked={nutritionPrefs.snacks}
                      onChange={(e) => setNutritionPrefs({...nutritionPrefs, snacks: e.target.checked})}
                      className="w-5 h-5 rounded" style={{ accentColor: colors.primary }} />
                    <div>
                      <span className="text-sm font-medium" style={{ color: colors.text }}>Collations si nécessaire</span>
                      <p className="text-xs" style={{ color: colors.textLight }}>Uniquement si vraiment utile</p>
                    </div>
                  </label>
                </Card>

                <Button onClick={() => setStep(2)} disabled={!userProfile.weight || !userProfile.age} className="w-full">
                  Continuer
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <Card>
                  <SectionTitle subtitle="Pour adapter les recettes">Tes équipements</SectionTitle>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {equipmentList.map(eq => (
                      <button key={eq.id} onClick={() => toggleEquipment(eq.id)}
                        className="p-3 rounded-xl text-center transition-all border-2"
                        style={{ 
                          borderColor: equipment[eq.id] ? colors.primary : 'transparent',
                          backgroundColor: equipment[eq.id] ? colors.primaryLight : colors.bg
                        }}>
                        <div className="text-2xl mb-1">{eq.icon}</div>
                        <div className="text-xs" style={{ color: colors.text }}>{eq.label}</div>
                      </button>
                    ))}
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Retour</Button>
                  <Button onClick={() => setStep(3)} className="flex-1">Continuer</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <Card>
                  <SectionTitle subtitle="Pour adapter ton alimentation">Sport du jour</SectionTitle>

                  {activities.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {activities.map(a => (
                        <div key={a.id} className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: colors.bg }}>
                          <div>
                            <div className="font-medium text-sm" style={{ color: colors.text }}>{a.time} · {a.type}</div>
                            <div className="text-xs" style={{ color: colors.textLight }}>{a.duration}min · {a.intensity}</div>
                          </div>
                          <button onClick={() => setActivities(activities.filter(x => x.id !== a.id))} style={{ color: '#EF4444' }}>
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showActivityForm ? (
                    <div className="p-4 rounded-xl" style={{ backgroundColor: colors.primaryLight }}>
                      <Select value={currentActivity.type}
                        onChange={(e) => setCurrentActivity({...currentActivity, type: e.target.value})}>
                        <option value="">Type d'activité...</option>
                        {sessionTypes.map(t => (<option key={t.name} value={t.name}>{t.icon} {t.name}</option>))}
                      </Select>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <Input type="number" placeholder="Durée (min)" value={currentActivity.duration}
                          onChange={(e) => setCurrentActivity({...currentActivity, duration: e.target.value})} />
                        <Input type="time" value={currentActivity.time}
                          onChange={(e) => setCurrentActivity({...currentActivity, time: e.target.value})} />
                      </div>
                      <Select className="mt-3" value={currentActivity.intensity}
                        onChange={(e) => setCurrentActivity({...currentActivity, intensity: e.target.value})}>
                        <option value="">Intensité...</option>
                        {intensities.map(i => (<option key={i.id} value={i.id}>{i.label}</option>))}
                      </Select>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowActivityForm(false)} className="flex-1">Annuler</Button>
                        <Button onClick={addActivity} disabled={!currentActivity.type || !currentActivity.duration || !currentActivity.time} className="flex-1">
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowActivityForm(true)}
                      className="w-full py-4 border-2 border-dashed rounded-xl text-sm"
                      style={{ borderColor: colors.border, color: colors.textLight }}>
                      + Ajouter une activité
                    </button>
                  )}
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Retour</Button>
                  <Button onClick={() => setStep(4)} className="flex-1">
                    {activities.length === 0 ? 'Jour de repos' : 'Continuer'}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <Card>
                  <SectionTitle subtitle="Ce que tu as à disposition">Tes ingrédients</SectionTitle>

                  <div className="flex gap-2 mb-4">
                    <Input placeholder="Ingrédient" value={newIngredient.name}
                      onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                      onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                      className="flex-1" />
                    <input type="text" placeholder="Qté" value={newIngredient.quantity}
                      onChange={(e) => setNewIngredient({...newIngredient, quantity: e.target.value})}
                      onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                      className="w-16 px-3 py-3 rounded-xl border text-sm"
                      style={{ borderColor: colors.border, backgroundColor: colors.bg }} />
                    <button onClick={addIngredient}
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: colors.primary, color: 'white' }}>
                      <Plus size={20} />
                    </button>
                  </div>

                  {ingredients.length > 0 ? (
                    <div className="space-y-2">
                      {ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2 rounded-xl" style={{ backgroundColor: colors.primaryLight }}>
                          <span className="text-sm" style={{ color: colors.text }}>
                            {ing.name}
                            {ing.quantity && <span style={{ color: colors.textLight }}> ({ing.quantity})</span>}
                          </span>
                          <button onClick={() => removeIngredient(i)} style={{ color: '#EF4444' }}><X size={16} /></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-sm" style={{ color: colors.textLight }}>
                      Ajoute les ingrédients que tu as
                    </p>
                  )}
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Retour</Button>
                  <Button onClick={() => setStep(5)} disabled={ingredients.length < 3} className="flex-1">Continuer</Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <Card>
                  <SectionTitle>Bilan énergétique</SectionTitle>
                  
                  {(() => {
                    const cal = calculateCalories();
                    return (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl" style={{ backgroundColor: colors.bg }}>
                          <div className="text-xs mb-3" style={{ color: colors.textLight }}>
                            Basé sur : {cal.details.gender}, {cal.details.weight}kg, {cal.details.height}cm, {cal.details.age}ans
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm" style={{ color: colors.textLight }}>Métabolisme de base</span>
                              <span className="font-medium" style={{ color: colors.text }}>{cal.bmr} kcal</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm" style={{ color: colors.textLight }}>Activité quotidienne</span>
                              <span className="font-medium" style={{ color: colors.text }}>+{cal.tdeeBase - cal.bmr} kcal</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t" style={{ borderColor: colors.border }}>
                              <span className="text-sm" style={{ color: colors.textLight }}>Journée normale</span>
                              <span className="font-semibold" style={{ color: colors.primary }}>{cal.tdeeBase} kcal</span>
                            </div>
                          </div>
                        </div>

                        {cal.trainingCalories > 0 && (
                          <div className="p-4 rounded-xl" style={{ backgroundColor: colors.secondaryLight }}>
                            <div className="flex justify-between">
                              <span className="text-sm" style={{ color: colors.textLight }}>Dépense sport</span>
                              <span className="font-semibold" style={{ color: colors.secondary }}>+{cal.trainingCalories} kcal</span>
                            </div>
                          </div>
                        )}

                        {cal.adjustment !== 0 && (
                          <div className="p-4 rounded-xl" style={{ backgroundColor: cal.adjustment < 0 ? '#FEF2F2' : colors.primaryLight }}>
                            <div className="flex justify-between">
                              <span className="text-sm" style={{ color: colors.textLight }}>Ajustement ({goal})</span>
                              <span className="font-semibold" style={{ color: cal.adjustment < 0 ? '#DC2626' : colors.primary }}>
                                {cal.adjustment > 0 ? '+' : ''}{cal.adjustment} kcal
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="p-4 rounded-xl" style={{ backgroundColor: colors.primary }}>
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">TOTAL DU JOUR</span>
                            <span className="text-2xl font-bold text-white">{cal.total} kcal</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </Card>

                {error && (
                  <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(4)} className="flex-1">Modifier</Button>
                  <Button onClick={generateTimeline} disabled={loading} className="flex-1">Créer mon plan</Button>
                </div>
              </div>
            )}

            {step === 6 && timeline && (
              <div className="space-y-6">
                <Card>
                  <SectionTitle>Ton plan du jour</SectionTitle>

                  {calorieBreakdown && (
                    <div className="grid grid-cols-3 gap-2 p-4 rounded-xl mb-6" style={{ backgroundColor: colors.primaryLight }}>
                      <div className="text-center">
                        <div className="text-xs" style={{ color: colors.textLight }}>Base</div>
                        <div className="font-semibold" style={{ color: colors.primary }}>{calorieBreakdown.tdeeBase}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs" style={{ color: colors.textLight }}>Sport</div>
                        <div className="font-semibold" style={{ color: colors.secondary }}>+{calorieBreakdown.trainingCalories}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs" style={{ color: colors.textLight }}>Total</div>
                        <div className="font-bold text-lg" style={{ color: colors.primary }}>{calorieBreakdown.total}</div>
                      </div>
                    </div>
                  )}

                  {timeline.summary && (
                    <div className="p-3 rounded-xl mb-4 text-sm italic" style={{ backgroundColor: colors.bg, color: colors.textLight }}>
                      {timeline.summary}
                    </div>
                  )}

                  <div className="space-y-4">
                    {timeline.meals?.map((meal, idx) => (
                      <div key={idx} className="p-4 rounded-xl" style={{ backgroundColor: colors.bg }}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="font-semibold" style={{ color: colors.primary }}>{meal.time}</span>
                            <span className="ml-2 font-medium" style={{ color: colors.text }}>{meal.name}</span>
                          </div>
                          <span className="text-sm px-2 py-1 rounded-full" style={{ backgroundColor: colors.primaryLight, color: colors.primary }}>
                            {meal.kcal} kcal
                          </span>
                        </div>

                        {meal.intention && (
                          <p className="text-sm mb-3" style={{ color: colors.secondary }}>→ {meal.intention}</p>
                        )}

                        {meal.recipe && (
                          <div className="p-3 rounded-lg bg-white mb-3">
                            <div className="font-medium text-sm mb-2" style={{ color: colors.text }}>{meal.recipe.name}</div>
                            <div className="text-xs space-y-1" style={{ color: colors.textLight }}>
                              {meal.recipe.ingredients?.map((ing, i) => (<div key={i}>· {ing}</div>))}
                            </div>
                            {meal.recipe.cooking && (
                              <div className="mt-2 text-xs" style={{ color: colors.secondary }}>🔥 {meal.recipe.cooking}</div>
                            )}
                            {meal.recipe.steps && (
                              <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: colors.border, color: colors.textLight }}>
                                {meal.recipe.steps}
                              </div>
                            )}
                          </div>
                        )}

                        {meal.tips && (
                          <p className="text-xs p-2 rounded-lg" style={{ backgroundColor: colors.secondaryLight, color: colors.secondary }}>
                            💡 {meal.tips}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {timeline.shopping?.length > 0 && (
                    <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: colors.bg }}>
                      <p className="font-medium mb-2" style={{ color: colors.text }}>À acheter</p>
                      <div className="flex flex-wrap gap-2">
                        {timeline.shopping.map((item, i) => (
                          <span key={i} className="text-sm px-3 py-1 rounded-full bg-white" style={{ color: colors.text }}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {timeline.hydration && (
                    <div className="mt-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>
                      💧 {timeline.hydration}
                    </div>
                  )}
                </Card>

                <Button variant="secondary" onClick={() => { setStep(1); setTimeline(null); setActivities([]); setIngredients([]); }} className="w-full">
                  Nouveau plan
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
