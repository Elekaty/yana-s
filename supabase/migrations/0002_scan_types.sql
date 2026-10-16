-- 0002 scan types
-- Adds speaking and writing to the game list. In Supabase, open Database → Types → game_type to see the description.

alter type game_type add value if not exists 'say_aloud';
alter type game_type add value if not exists 'write';

comment on type game_type is 'How a mini-task is played: flashcard, logic, physical, say_aloud (speak it), or write.';
