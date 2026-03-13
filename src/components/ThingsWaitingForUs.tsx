import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Check, MoreVertical } from 'lucide-react';

interface Activity {
  id: string;
  text: string;
  addedBy: 'parik' | 'sarah';
  isDone: boolean;
  rotation: number;
}

interface ThingsWaitingForUsProps {
  user: 'parik' | 'sarah' | null;
}

export function ThingsWaitingForUs({ user }: ThingsWaitingForUsProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch activities on mount
  React.useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activity');
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const newActivity: Activity = {
        id: Date.now().toString(),
        text: inputValue.trim(),
        addedBy: user,
        isDone: false,
        rotation: Math.random() * 4 - 2, // Random rotation between -2 and 2 degrees
      };

      // Save to API
      const res = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivity),
      });

      if (res.ok) {
        setActivities([newActivity, ...activities]);
        setInputValue('');
      } else {
        alert('Failed to save activity');
      }
    } catch (err) {
      console.error('Failed to save activity:', err);
      alert('Error saving activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDone = (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    const newIsDone = !activity.isDone;
    setActivities(activities.map(a =>
      a.id === id ? { ...a, isDone: newIsDone } : a
    ));

    // Update in database
    fetch('/api/activity', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isDone: newIsDone }),
    }).catch(err => console.error('Failed to update activity:', err));
  };

  const deleteActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
    
    // Delete from database
    fetch('/api/activity', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(err => console.error('Failed to delete activity:', err));
  };

  const undoneCount = activities.filter(a => !a.isDone).length;
  const doneActivities = activities.filter(a => a.isDone);

  const getNoteColor = (addedBy: 'parik' | 'sarah') => {
    if (addedBy === 'parik') {
      return 'bg-gradient-to-br from-blue-400/20 to-blue-300/10 border-blue-400/30 shadow-blue-500/10';
    } else {
      return 'bg-gradient-to-br from-pink-400/20 to-pink-300/10 border-pink-400/30 shadow-pink-500/10';
    }
  };

  const getTextColor = (addedBy: 'parik' | 'sarah') => {
    return addedBy === 'parik' ? 'text-blue-100' : 'text-pink-100';
  };

  const getAccentColor = (addedBy: 'parik' | 'sarah') => {
    return addedBy === 'parik' ? 'text-blue-300' : 'text-pink-300';
  };

  return (
    <section className="glass-card p-6 md:p-12 relative overflow-visible border-hunyadi-yellow/5">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-hunyadi-yellow/20 to-transparent" />

      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-2xl sm:text-3xl font-cursive text-white/80 mb-2 tracking-wide">Things waiting for us</p>
        <p className="text-[10px] uppercase tracking-[0.4em] opacity-40 font-black text-hunyadi-yellow mb-3">💌</p>
        {undoneCount > 0 && (
          <p className="text-xs font-medium text-hunyadi-yellow/60">
            {undoneCount} {undoneCount === 1 ? 'thing' : 'things'} waiting for us
          </p>
        )}
      </div>

      {/* Input Section */}
      {user && (
        <form onSubmit={handleAddActivity} className="mb-12">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Add an activity..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-3 sm:px-4 py-3 text-sm placeholder-white/40 focus:outline-none focus:border-hunyadi-yellow/30 focus:bg-white/10 transition-all text-white"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSubmitting}
              className="px-4 sm:px-6 py-3 bg-hunyadi-yellow/10 hover:bg-hunyadi-yellow/20 border border-hunyadi-yellow/30 rounded-2xl text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {/* Activities Board */}
      {activities.length > 0 ? (
        <div className="space-y-8">
          {/* Pending Activities */}
          {undoneCount > 0 && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-max">
                <AnimatePresence mode="popLayout">
                  {activities
                    .filter(a => !a.isDone)
                    .map((activity) => (
                      <motion.div
                        key={activity.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: activity.rotation }}
                        exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                        whileHover={{ scale: 1.02 }}
                        onMouseEnter={() => setDraggedId(activity.id)}
                        onMouseLeave={() => setDraggedId(null)}
                        className={`p-5 rounded-2xl border-2 cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl transition-all ${getNoteColor(activity.addedBy)}`}
                        style={{
                          minHeight: '120px',
                          transform: `rotate(${activity.rotation}deg)`,
                        }}
                      >
                        <div className="flex flex-col h-full justify-between">
                            {/* Content */}
                          <p className={`text-sm font-medium leading-relaxed font-cursive ${getTextColor(activity.addedBy)} mb-3`}>
                            {activity.text}
                          </p>

                          {/* Actions */}
                          <div className="flex items-end justify-between">
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleDone(activity.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-green-300 hover:text-green-200 hover:bg-green-500/10 transition-all"
                              >
                                <Check size={14} />
                              </button>
                              <div className="relative">
                                <button
                                  onClick={() => setOpenMenuId(openMenuId === activity.id ? null : activity.id)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/5 transition-all"
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {openMenuId === activity.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute bottom-full right-0 mb-2 bg-ink/90 border border-white/10 rounded-lg overflow-hidden z-50"
                                  >
                                    <button
                                      onClick={() => {
                                        deleteActivity(activity.id);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/20 transition-all whitespace-nowrap"
                                    >
                                      Delete
                                    </button>
                                  </motion.div>
                                )}
                              </div>
                            </div>

                            {/* Added by */}
                            <p className={`text-[9px] font-bold uppercase tracking-[0.1em] ${getAccentColor(activity.addedBy)}`}>
                              {activity.addedBy === 'parik' ? 'added by parik' : 'added by sarah'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Completed Activities */}
          {doneActivities.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-t border-white/10 pt-8"
            >
              <p className="text-xs uppercase tracking-[0.2em] opacity-40 font-bold mb-4 text-white/60">✓ Done</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-max">
                <AnimatePresence mode="popLayout">
                  {doneActivities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 0.5, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-5 rounded-2xl border-2 border-dashed opacity-50 shadow-lg ${getNoteColor(activity.addedBy)}`}
                      style={{
                        transform: `rotate(${activity.rotation}deg)`,
                        textDecoration: 'line-through',
                      }}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <p className={`text-sm font-medium leading-relaxed font-cursive ${getTextColor(activity.addedBy)} mb-3 opacity-60`}>
                          {activity.text}
                        </p>

                        <div className="flex items-end justify-between">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleDone(activity.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-green-300 hover:text-green-200 hover:bg-green-500/10 transition-all opacity-60"
                            >
                              <Check size={14} />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === activity.id ? null : activity.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/5 transition-all opacity-60"
                              >
                                <MoreVertical size={14} />
                              </button>
                              {openMenuId === activity.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="absolute bottom-full right-0 mb-2 bg-ink/90 border border-white/10 rounded-lg overflow-hidden z-50"
                                >
                                  <button
                                    onClick={() => {
                                      deleteActivity(activity.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/20 transition-all whitespace-nowrap"
                                  >
                                    Delete
                                  </button>
                                </motion.div>
                              )}
                            </div>
                          </div>

                          <p className={`text-[9px] font-bold uppercase tracking-[0.1em] opacity-60 ${getAccentColor(activity.addedBy)}`}>
                            {activity.addedBy === 'parik' ? 'added by parik' : 'added by sarah'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-sm font-serif italic opacity-60 tracking-wide">
            No activities yet :(
          </p>
        </motion.div>
      )}
    </section>
  );
}
