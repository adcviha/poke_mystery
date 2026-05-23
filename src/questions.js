// ===== Poké_Mystery Question Pool =====
// 60 questions sampled down to 15 per quiz session.
// Each question targets a primary + secondary axis.
//
window.Poke_Mystery = window.Poke_Mystery || {};

// Weight sign conventions (matches coords array index):
//   reach:  Humble(-) ↔ Cosmic(+)
//   tempo:  Mercurial(-) ↔ Stoic(+)
//   nature: Wild(-) ↔ Wrought(+)
//   tether: Kith(-) ↔ Kinless(+)
//   aura:   Earnest(-) ↔ Capricious(+)
//
// Format distribution: 20 two-option, 20 three-option, 20 four-option.
// Voice: calibrated against PMD Explorers of Sky — short, conversational, sometimes funny.

Poke_Mystery.questions = [

  // ================================================================
  // REACH (Humble ↔ Cosmic) — 12 questions
  // ================================================================

  // -- Reach × Tempo --

  { id: "q01", primary: "reach", secondary: "tempo",
    text: "Do you believe in ghosts?",
    options: [
      { text: "Yes. There's too much we can't explain.", weight: { reach: 3, tempo: 0.5, nature: 0, tether: 0, aura: 0 } },
      { text: "No. I'll believe it when I see it.", weight: { reach: -3, tempo: -0.5, nature: 0, tether: 0, aura: 0 } }
    ] },

  { id: "q02", primary: "reach", secondary: "tempo",
    text: "When you look at the stars, what do you feel?",
    options: [
      { text: "Awe. Every one of those is a sun, and somewhere someone might be looking back.", weight: { reach: 2.5, tempo: 0, nature: 0, tether: 0, aura: 0 } },
      { text: "Nothing in particular. They've always been there.", weight: { reach: -2.5, tempo: 1, nature: 0, tether: 0, aura: 0 } },
      { text: "A kind of loneliness. Not bad — just aware of the distance.", weight: { reach: 2.5, tempo: -1, nature: 0, tether: 0, aura: 0 } }
    ] },

  { id: "q03", primary: "reach", secondary: "tempo",
    text: "The path splits. One way climbs to a ridge overlooking the whole valley. The other stays low, following a stream through the trees.",
    options: [
      { text: "Ridge. I want to see how far I can see.", weight: { reach: 2, tempo: 1.5, nature: 0, tether: 0, aura: 0 } },
      { text: "Ridge. Race you to the top!", weight: { reach: 2, tempo: -1.5, nature: 0, tether: 0, aura: 0 } },
      { text: "Stream. I'd rather be in it than above it.", weight: { reach: -2, tempo: 1.5, nature: 0, tether: 0, aura: 0 } },
      { text: "Stream. The light's better down there right now.", weight: { reach: -2, tempo: -1.5, nature: 0, tether: 0, aura: 0 } }
    ] },

  // -- Reach × Tether --

  { id: "q04", primary: "reach", secondary: "tether",
    text: "Would you rather be remembered by many people for one thing, or by a few people for everything?",
    options: [
      { text: "Many people for one thing.", weight: { reach: 3, tempo: 0, nature: 0, tether: 0.5, aura: 0 } },
      { text: "A few people for everything.", weight: { reach: -3, tempo: 0, nature: 0, tether: -0.5, aura: 0 } }
    ] },

  { id: "q05", primary: "reach", secondary: "tether",
    text: "You get a free plane ticket to anywhere.",
    options: [
      { text: "Somewhere nobody I know has ever been.", weight: { reach: 2.5, tempo: 0, nature: 0, tether: 1, aura: 0 } },
      { text: "Where my best friend lives. I haven't seen them in years.", weight: { reach: 2.5, tempo: 0, nature: 0, tether: -1, aura: 0 } },
      { text: "Home. My family's there. What else would I do with a free ticket?", weight: { reach: -2.5, tempo: 0, nature: 0, tether: 0, aura: 0 } }
    ] },

  { id: "q06", primary: "reach", secondary: "tether",
    text: "What were you doing the last time you felt completely at home?",
    options: [
      { text: "Standing somewhere I'd never been, alone, with the strange feeling the place had been waiting for me.", weight: { reach: 2, tempo: 0, nature: 0, tether: 1.5, aura: 0 } },
      { text: "Sitting at a long table with people I love, someone telling a story I'd heard three times, not wanting it to end.", weight: { reach: 2, tempo: 0, nature: 0, tether: -1.5, aura: 0 } },
      { text: "Walking my neighbourhood at dusk. Same route as always. A neighbour waved. Nothing happened.", weight: { reach: -2, tempo: 0, nature: 0, tether: 1.5, aura: 0 } },
      { text: "Cooking with my sister. She burned the garlic again. We ate it anyway.", weight: { reach: -2, tempo: 0, nature: 0, tether: -1.5, aura: 0 } }
    ] },

  // -- Reach × Nature --

  { id: "q07", primary: "reach", secondary: "nature",
    text: "Do you think the universe has a purpose?",
    options: [
      { text: "Yes. I don't know what it is, but I feel it.", weight: { reach: 3, tempo: 0, nature: -0.5, tether: 0, aura: 0 } },
      { text: "No. Things just are. That's enough.", weight: { reach: -3, tempo: 0, nature: 0.5, tether: 0, aura: 0 } }
    ] },

  { id: "q08", primary: "reach", secondary: "nature",
    text: "Your friend asks why you're here — not here at the café, but here, alive, on this planet.",
    options: [
      { text: "I've thought about this a lot. I have theories.", weight: { reach: 2.5, tempo: 0, nature: 1, tether: 0, aura: 0 } },
      { text: "I don't know. But I feel the answer in my body sometimes, even if I can't say it.", weight: { reach: 2.5, tempo: 0, nature: -1, tether: 0, aura: 0 } },
      { text: "I'm here to be here. The question doesn't really interest me.", weight: { reach: -2.5, tempo: 0, nature: 0, tether: 0, aura: 0 } }
    ] },

  { id: "q09", primary: "reach", secondary: "nature",
    text: "Would you rather understand everything about one tree, or one thing about every tree?",
    options: [
      { text: "Everything about one tree. Every root, every season, what the moss knows.", weight: { reach: -2, tempo: 0, nature: -1.5, tether: 0, aura: 0 } },
      { text: "Everything about one tree — through data. Measure it, document it, write it up.", weight: { reach: -2, tempo: 0, nature: 1.5, tether: 0, aura: 0 } },
      { text: "One thing about every tree. If you know the pattern you can read any forest on earth.", weight: { reach: 2, tempo: 0, nature: 1.5, tether: 0, aura: 0 } },
      { text: "One thing about every tree. But I'd learn it by walking through every forest, not by studying a diagram.", weight: { reach: 2, tempo: 0, nature: -1.5, tether: 0, aura: 0 } }
    ] },

  // -- Reach × Aura --

  { id: "q10", primary: "reach", secondary: "aura",
    text: "Do you pray?",
    options: [
      { text: "Yes. Or something close to it.", weight: { reach: 3, tempo: 0, nature: 0, tether: 0, aura: -0.5 } },
      { text: "No. That's not how I'm wired.", weight: { reach: -3, tempo: 0, nature: 0, tether: 0, aura: 0.5 } }
    ] },

  { id: "q11", primary: "reach", secondary: "aura",
    text: "An old church. Empty. No service, no tourists. Just stone and silence.",
    options: [
      { text: "Reverence. Someone meant this. The sincerity is still in the walls.", weight: { reach: 2.5, tempo: 0, nature: 0, tether: 0, aura: -1 } },
      { text: "Curiosity. That ceiling's holding itself up in a way that shouldn't work.", weight: { reach: 2.5, tempo: 0, nature: 0, tether: 0, aura: 1 } },
      { text: "Not much. It's a building. A pretty one, but still a building.", weight: { reach: -2.5, tempo: 0, nature: 0, tether: 0, aura: 0 } }
    ] },

  { id: "q12", primary: "reach", secondary: "aura",
    text: "A stranger tells you they can read your future.",
    options: [
      { text: "Sit down. Even if it's not real, something about being seen feels true.", weight: { reach: 2, tempo: 0, nature: 0, tether: 0, aura: -1.5 } },
      { text: "Ask them how it works. Cold reading? Barnum statements? I want to understand the mechanism.", weight: { reach: 2, tempo: 0, nature: 0, tether: 0, aura: 1.5 } },
      { text: "Politely decline. My future is just my life. I'll get there.", weight: { reach: -2, tempo: 0, nature: 0, tether: 0, aura: -1.5 } },
      { text: "Tell them my past instead and ask if that changes anything. Let's make this interesting.", weight: { reach: -2, tempo: 0, nature: 0, tether: 0, aura: 1.5 } }
    ] },

  // ================================================================
  // TEMPO (Mercurial ↔ Stoic) — 12 questions
  // ================================================================

  // -- Tempo × Reach --

  { id: "q13", primary: "tempo", secondary: "reach",
    text: "Good news and bad news. Which do you want first?",
    options: [
      { text: "The bad news. Get it over with.", weight: { reach: 0.5, tempo: -3, nature: 0, tether: 0, aura: 0 } },
      { text: "The good news.", weight: { reach: -0.5, tempo: 3, nature: 0, tether: 0, aura: 0 } }
    ] },

  { id: "q14", primary: "tempo", secondary: "reach",
    text: "A test is coming up. How do you study?",
    options: [
      { text: "Study hard, every day.", weight: { reach: -1, tempo: 2.5, nature: 0, tether: 0, aura: 0 } },
      { text: "At the last second. Pressure works.", weight: { reach: 0, tempo: -2.5, nature: 0, tether: 0, aura: 0 } },
      { text: "I make a schedule. Colour-coded. With backup slots.", weight: { reach: 1, tempo: 2.5, nature: 0, tether: 0, aura: 0 } }
    ] },

  { id: "q15", primary: "tempo", secondary: "reach",
    text: "You're stuck in traffic. Nothing is moving.",
    options: [
      { text: "Already recalculating the route, checking three apps, texting that I'll be late.", weight: { reach: 1.5, tempo: -2, nature: 0, tether: 0, aura: 0 } },
      { text: "Fine. I'll sit here. The radio's on. The world can wait.", weight: { reach: -1.5, tempo: 2, nature: 0, tether: 0, aura: 0 } },
      { text: "Watching the person in the next car. They're singing. Badly. I hope they never stop.", weight: { reach: -1.5, tempo: -2, nature: 0, tether: 0, aura: 0 } },
      { text: "Thinking about how traffic is a collective rhythm problem. Someone's probably written a paper on this intersection.", weight: { reach: 1.5, tempo: 2, nature: 0, tether: 0, aura: 0 } }
    ] },

  // -- Tempo × Nature --

  { id: "q16", primary: "tempo", secondary: "nature",
    text: "Do you prefer to be busy or to have a lot of free time?",
    options: [
      { text: "Busy. I need momentum.", weight: { reach: 0, tempo: -3, nature: 0.5, tether: 0, aura: 0 } },
      { text: "Free time. I need space.", weight: { reach: 0, tempo: 3, nature: -0.5, tether: 0, aura: 0 } }
    ] },

  { id: "q17", primary: "tempo", secondary: "nature",
    text: "A sudden storm hits while you're out walking. No umbrella. You're already soaked.",
    options: [
      { text: "Run. Not anywhere specific — it just feels good to move with it.", weight: { reach: 0, tempo: -2.5, nature: -1, tether: 0, aura: 0 } },
      { text: "Open the radar app. I want to see where it's heading and exactly when it'll pass.", weight: { reach: 0, tempo: -2.5, nature: 1, tether: 0, aura: 0 } },
      { text: "Keep walking. I'm already wet. It'll pass when it passes.", weight: { reach: 0, tempo: 2.5, nature: 0, tether: 0, aura: 0 } }
    ] },

  { id: "q18", primary: "tempo", secondary: "nature",
    text: "You see a big, comfortable bed. Your first reaction:",
    options: [
      { text: "Jump on it!", weight: { reach: 0, tempo: -2, nature: -1.5, tether: 0, aura: 0 } },
      { text: "Belly flop!", weight: { reach: 0, tempo: -2, nature: -1, tether: 0, aura: 0 } },
      { text: "Curl up and stay there. Possibly forever.", weight: { reach: 0, tempo: 2, nature: -1.5, tether: 0, aura: 0 } },
      { text: "Check the thread count first.", weight: { reach: 0, tempo: 2, nature: 1.5, tether: 0, aura: 0 } }
    ] },

  // -- Tempo × Tether --

  { id: "q19", primary: "tempo", secondary: "tether",
    text: "Are you often late?",
    options: [
      { text: "Yes. Time is... flexible.", weight: { reach: 0, tempo: -3, nature: 0, tether: 0.5, aura: 0 } },
      { text: "No. Being late is disrespectful.", weight: { reach: 0, tempo: 3, nature: 0, tether: -0.5, aura: 0 } }
    ] },

  { id: "q20", primary: "tempo", secondary: "tether",
    text: "You win the lottery. What do you do with the money?",
    options: [
      { text: "Spend it now. I've been waiting for this.", weight: { reach: 0, tempo: -2.5, nature: 0, tether: 1, aura: 0 } },
      { text: "Save it. All of it. Compound interest is a kind of patience.", weight: { reach: 0, tempo: 2.5, nature: 0, tether: 1, aura: 0 } },
      { text: "Give most of it away. To family, friends, the person who always holds the door at the bakery.", weight: { reach: 0, tempo: 2.5, nature: 0, tether: -1, aura: 0 } }
    ] },

  { id: "q21", primary: "tempo", secondary: "tether",
    text: "It's your day off. No obligations. What does the morning look like?",
    options: [
      { text: "Up early. Coffee, book, sun coming up. The quiet hours are sacred.", weight: { reach: 0, tempo: 2, nature: 0, tether: 1.5, aura: 0 } },
      { text: "Three projects deep by 9am. Not work — things I actually want to do.", weight: { reach: 0, tempo: -2, nature: 0, tether: 1.5, aura: 0 } },
      { text: "Sleep in. Lie there deciding what kind of day it's going to be. The deciding is part of it.", weight: { reach: 0, tempo: 2, nature: 0, tether: -1.5, aura: 0 } },
      { text: "Whatever I feel like. Maybe I start cleaning and end up painting a wall. The point is no plan.", weight: { reach: 0, tempo: -2, nature: 0, tether: -1.5, aura: 0 } }
    ] },

  // -- Tempo × Aura --

  { id: "q22", primary: "tempo", secondary: "aura",
    text: "When you see a switch, do you feel an overwhelming urge to flip it?",
    options: [
      { text: "Yes. Every time.", weight: { reach: 0, tempo: -3, nature: 0, tether: 0, aura: 0.5 } },
      { text: "No. That's weird.", weight: { reach: 0, tempo: 3, nature: 0, tether: 0, aura: -0.5 } }
    ] },

  { id: "q23", primary: "tempo", secondary: "aura",
    text: "Your friend fails to show up at the promised time.",
    options: [
      { text: "I'm already texting them. Where are you??", weight: { reach: 0, tempo: -2.5, nature: 0, tether: 0, aura: -1 } },
      { text: "I wait. They'll get here. People run late.", weight: { reach: 0, tempo: 2.5, nature: 0, tether: 0, aura: -1 } },
      { text: "I order for them. Guess what they'd want. If I get it wrong it's funnier.", weight: { reach: 0, tempo: 2.5, nature: 0, tether: 0, aura: 1 } }
    ] },

  { id: "q24", primary: "tempo", secondary: "aura",
    text: "You find an old clock in a junk shop. It still works. Do you buy it?",
    options: [
      { text: "Yes. The ticking belongs in my house. It'll give the rooms a pulse.", weight: { reach: 0, tempo: -2, nature: 0, tether: 0, aura: -1.5 } },
      { text: "Yes. But I'm going to set it eleven minutes slow on purpose. See who notices.", weight: { reach: 0, tempo: 2, nature: 0, tether: 0, aura: 1.5 } },
      { text: "No. I don't need more objects. My phone tells time.", weight: { reach: 0, tempo: -2, nature: 0, tether: 0, aura: 1.5 } },
      { text: "No. A stopped clock is more honest. Not everything needs to run.", weight: { reach: 0, tempo: 2, nature: 0, tether: 0, aura: -1.5 } }
    ] },

  // ================================================================
  // NATURE (Wild ↔ Wrought) — 12 questions
  // ================================================================

  // -- Nature × Reach --

  { id: "q25", primary: "nature", secondary: "reach",
    text: "Do you prefer to play outside rather than inside?",
    options: [
      { text: "Yes. Outside is where everything actually happens.", weight: { reach: -0.5, tempo: 0, nature: -3, tether: 0, aura: 0 } },
      { text: "No. Inside has internet, climate control, and fewer bugs.", weight: { reach: 0.5, tempo: 0, nature: 3, tether: 0, aura: 0 } }
    ] },

  { id: "q26", primary: "nature", secondary: "reach",
    text: "You're lost in an unfamiliar city.",
    options: [
      { text: "Follow my gut. Walk toward what feels right — the light, the noise, the smell of bread.", weight: { reach: -1, tempo: 0, nature: -2.5, tether: 0, aura: 0 } },
      { text: "Open maps, triangulate my position, calculate the fastest route.", weight: { reach: 1, tempo: 0, nature: 2.5, tether: 0, aura: 0 } },
      { text: "Ask someone. They've lived here their whole life and know things the map doesn't.", weight: { reach: 0, tempo: 0, nature: -2.5, tether: 0, aura: 0 } }
    ] },

  { id: "q27", primary: "nature", secondary: "reach",
    text: "You find an injured bird on the sidewalk.",
    options: [
      { text: "Pick it up. Warm hands. Quiet voice. I've done this before.", weight: { reach: -1.5, tempo: 0, nature: -2, tether: 0, aura: 0 } },
      { text: "Look up wildlife rehab centres on my phone. Call the one with the best reviews.", weight: { reach: -1.5, tempo: 0, nature: 2, tether: 0, aura: 0 } },
      { text: "Pick it up and carry it three miles to the nearest vet. I don't care if it takes all afternoon.", weight: { reach: 1.5, tempo: 0, nature: -2, tether: 0, aura: 0 } },
      { text: "Research the species, its migration pattern, what it eats. If I understand the bird, I can help the bird.", weight: { reach: 1.5, tempo: 0, nature: 2, tether: 0, aura: 0 } }
    ] },

  // -- Nature × Tempo --

  { id: "q28", primary: "nature", secondary: "tempo",
    text: "Would you rather fix something broken or replace it?",
    options: [
      { text: "Fix it. Even if it takes longer.", weight: { reach: 0, tempo: 0.5, nature: -3, tether: 0, aura: 0 } },
      { text: "Replace it. New is more efficient.", weight: { reach: 0, tempo: -0.5, nature: 3, tether: 0, aura: 0 } }
    ] },

  { id: "q29", primary: "nature", secondary: "tempo",
    text: "You're cooking. How do you measure ingredients?",
    options: [
      { text: "By feel. A handful of this, a pinch of that. My grandmother cooked this way.", weight: { reach: 0, tempo: 1, nature: -2.5, tether: 0, aura: 0 } },
      { text: "I weigh everything. Cooking is chemistry if you're honest about it.", weight: { reach: 0, tempo: 1, nature: 2.5, tether: 0, aura: 0 } },
      { text: "I don't cook. I assemble. Toast, eggs, done in six minutes.", weight: { reach: 0, tempo: -1, nature: 2.5, tether: 0, aura: 0 } }
    ] },

  { id: "q30", primary: "nature", secondary: "tempo",
    text: "Which of these sounds makes you stop what you're doing?",
    options: [
      { text: "Wind through pine trees — that low hum that sounds like the earth breathing.", weight: { reach: 0, tempo: 1.5, nature: -2, tether: 0, aura: 0 } },
      { text: "Thunder directly overhead. The crack before you've finished registering the flash.", weight: { reach: 0, tempo: -1.5, nature: -2, tether: 0, aura: 0 } },
      { text: "A train horn at night, far away. Someone somewhere is arriving or leaving.", weight: { reach: 0, tempo: 1.5, nature: 2, tether: 0, aura: 0 } },
      { text: "A dial-up modem. No, seriously — it's a handshake between two machines that have never met.", weight: { reach: 0, tempo: -1.5, nature: 2, tether: 0, aura: 0 } }
    ] },

  // -- Nature × Tether --

  { id: "q31", primary: "nature", secondary: "tether",
    text: "Do you trust your instincts?",
    options: [
      { text: "Yes. They've kept me alive this long.", weight: { reach: 0, tempo: 0, nature: -3, tether: -0.5, aura: 0 } },
      { text: "Not really. That's why I double-check everything.", weight: { reach: 0, tempo: 0, nature: 3, tether: 0.5, aura: 0 } }
    ] },

  { id: "q32", primary: "nature", secondary: "tether",
    text: "A garden has been untended all season. The gate is open.",
    options: [
      { text: "Walk through slowly, touching each stem. I name the plants I know and wonder about the ones I don't.", weight: { reach: 0, tempo: 0, nature: -2.5, tether: -1, aura: 0 } },
      { text: "Sit on the wall and look. Not fixing anything. Just looking. The neglect is part of its shape.", weight: { reach: 0, tempo: 0, nature: -2.5, tether: 1, aura: 0 } },
      { text: "Start planning the restoration. Irrigation, companion planting, bloom schedule. This garden is a system.", weight: { reach: 0, tempo: 0, nature: 2.5, tether: 0, aura: 0 } }
    ] },

  { id: "q33", primary: "nature", secondary: "tether",
    text: "You're moving house. The thing you pack last — the thing you didn't want to put in a box at all:",
    options: [
      { text: "A rock my kid gave me when they were four. It's just a rock. I've moved it across three cities.", weight: { reach: 0, tempo: 0, nature: -2, tether: -1.5, aura: 0 } },
      { text: "A kitchen knife my grandfather made. The handle's worn to the shape of three generations of hands.", weight: { reach: 0, tempo: 0, nature: 2, tether: -1.5, aura: 0 } },
      { text: "A book I've never lent anyone. The notes in the margins are basically a diary.", weight: { reach: 0, tempo: 0, nature: -2, tether: 1.5, aura: 0 } },
      { text: "My hard drive. I know the cloud exists. I don't care. Some things should have weight.", weight: { reach: 0, tempo: 0, nature: 2, tether: 1.5, aura: 0 } }
    ] },

  // -- Nature × Aura --

  { id: "q34", primary: "nature", secondary: "aura",
    text: "Do you believe in fate?",
    options: [
      { text: "Yes. Things connect in ways I can't explain.", weight: { reach: 0, tempo: 0, nature: -3, tether: 0, aura: -0.5 } },
      { text: "No. We tell ourselves stories to make randomness feel meaningful.", weight: { reach: 0, tempo: 0, nature: 3, tether: 0, aura: 0.5 } }
    ] },

  { id: "q35", primary: "nature", secondary: "aura",
    text: "A tool breaks in your hand. Your first thought:",
    options: [
      { text: "I can fix this. Where's the toolbox?", weight: { reach: 0, tempo: 0, nature: -2.5, tether: 0, aura: -1 } },
      { text: "I can fix this. Where's the manual?", weight: { reach: 0, tempo: 0, nature: 2.5, tether: 0, aura: -1 } },
      { text: "I was looking for an excuse to replace this anyway.", weight: { reach: 0, tempo: 0, nature: 2.5, tether: 0, aura: 1 } }
    ] },

  { id: "q36", primary: "nature", secondary: "aura",
    text: "You're alone at the beach at sunset. The tide is going out.",
    options: [
      { text: "Standing at the waterline, feeling the sand pull away under my feet. Not thinking. Just there.", weight: { reach: 0, tempo: 0, nature: -2, tether: 0, aura: -1.5 } },
      { text: "Looking for interesting shells. Each one is a hundred thousand years old. The ocean is just showing off.", weight: { reach: 0, tempo: 0, nature: -2, tether: 0, aura: 1.5 } },
      { text: "Taking photos for reference. I want to remember the exact colour temperature of this light.", weight: { reach: 0, tempo: 0, nature: 2, tether: 0, aura: -1.5 } },
      { text: "Building a sandcastle that's definitely going to be gone in an hour. That's the point.", weight: { reach: 0, tempo: 0, nature: 2, tether: 0, aura: 1.5 } }
    ] },

  // ================================================================
  // TETHER (Kith ↔ Kinless) — 12 questions
  // ================================================================

  // -- Tether × Reach --

  { id: "q37", primary: "tether", secondary: "reach",
    text: "Do you feel lonely when you're alone?",
    options: [
      { text: "Yes. I'm not embarrassed by that.", weight: { reach: -0.5, tempo: 0, nature: 0, tether: -3, aura: 0 } },
      { text: "No. Alone and lonely are completely different things.", weight: { reach: 0.5, tempo: 0, nature: 0, tether: 3, aura: 0 } }
    ] },

  { id: "q38", primary: "tether", secondary: "reach",
    text: "It's the weekend, but no one can hang out.",
    options: [
      { text: "Go on a trip by myself. That's freedom, not loneliness.", weight: { reach: 1, tempo: 0, nature: 0, tether: 2.5, aura: 0 } },
      { text: "Honestly? Kind of relieved. I needed the day.", weight: { reach: -1, tempo: 0, nature: 0, tether: 2.5, aura: 0 } },
      { text: "Call someone else. There's always someone.", weight: { reach: 0, tempo: 0, nature: 0, tether: -2.5, aura: 0 } }
    ] },

  { id: "q39", primary: "tether", secondary: "reach",
    text: "You walk into a room of people you don't know. What do you actually notice first?",
    options: [
      { text: "Who looks like they don't want to be here. I usually find that person and stand near them.", weight: { reach: -1.5, tempo: 0, nature: 0, tether: -2, aura: 0 } },
      { text: "Who's already laughing. I want in on whatever's funny.", weight: { reach: -1.5, tempo: 0, nature: 0, tether: -2, aura: 0 } },
      { text: "The layout. Where the door is, where the quiet corner is, how long I need to stay.", weight: { reach: 1.5, tempo: 0, nature: 0, tether: 2, aura: 0 } },
      { text: "Whether anyone else is also standing alone. Easier to be alone near someone else who's alone.", weight: { reach: 1.5, tempo: 0, nature: 0, tether: 2, aura: 0 } }
    ] },

  // -- Tether × Tempo --

  { id: "q40", primary: "tether", secondary: "tempo",
    text: "Do you hate being the last person to leave?",
    options: [
      { text: "Yes. An empty room feels different.", weight: { reach: 0, tempo: 0.5, nature: 0, tether: -3, aura: 0 } },
      { text: "No. I kind of like it. The quiet after.", weight: { reach: 0, tempo: -0.5, nature: 0, tether: 3, aura: 0 } }
    ] },

  { id: "q41", primary: "tether", secondary: "tempo",
    text: "Someone you barely know asks if you want to grab coffee.",
    options: [
      { text: "Yes. That's how friendships start.", weight: { reach: 0, tempo: -1, nature: 0, tether: -2.5, aura: 0 } },
      { text: "Maybe. Let me check my calendar.", weight: { reach: 0, tempo: 1, nature: 0, tether: 2.5, aura: 0 } },
      { text: "Yes, but I need at least a day's notice. Spontaneity is not my thing.", weight: { reach: 0, tempo: 1, nature: 0, tether: 2.5, aura: 0 } }
    ] },

  { id: "q42", primary: "tether", secondary: "tempo",
    text: "The phone rings. Unknown number.",
    options: [
      { text: "Answer it. Could be important. Could be a wrong number with a great story.", weight: { reach: 0, tempo: -1.5, nature: 0, tether: -2, aura: 0 } },
      { text: "Let it ring. If it's important they'll leave a message.", weight: { reach: 0, tempo: 1.5, nature: 0, tether: 2, aura: 0 } },
      { text: "Answer it, but I'm already annoyed. Unknown callers are never good news.", weight: { reach: 0, tempo: -1.5, nature: 0, tether: -2, aura: 0 } },
      { text: "Stare at it until it stops. Google the number. Never do anything with the information.", weight: { reach: 0, tempo: 1.5, nature: 0, tether: 2, aura: 0 } }
    ] },

  // -- Tether × Nature --

  { id: "q43", primary: "tether", secondary: "nature",
    text: "There is a wallet on the ground. No one around.",
    options: [
      { text: "Turn it in. Someone's day is ruined right now.", weight: { reach: 0, tempo: 0, nature: -0.5, tether: -3, aura: 0 } },
      { text: "Leave it. Not my problem.", weight: { reach: 0, tempo: 0, nature: 0.5, tether: 3, aura: 0 } }
    ] },

  { id: "q44", primary: "tether", secondary: "nature",
    text: "Your neighbour's cat starts visiting your porch every day.",
    options: [
      { text: "I've already named it. I know it has a real name. I don't care.", weight: { reach: 0, tempo: 0, nature: -1, tether: -2.5, aura: 0 } },
      { text: "I put out water. Then food. Then a bed. This is how you get a cat, apparently.", weight: { reach: 0, tempo: 0, nature: -1, tether: -2.5, aura: 0 } },
      { text: "I acknowledge the cat but maintain a respectful distance. Two independent entities coexisting.", weight: { reach: 0, tempo: 0, nature: 1, tether: 2.5, aura: 0 } }
    ] },

  { id: "q45", primary: "tether", secondary: "nature",
    text: "A friend is moving away. The going-away party is over. Everyone's gone.",
    options: [
      { text: "Help them pack the last box. The one with the weird stuff — the lamp that doesn't work, the mug with no handle.", weight: { reach: 0, tempo: 0, nature: -1.5, tether: -2, aura: 0 } },
      { text: "Give them a spreadsheet of restaurants near their new place. Already researched. With notes.", weight: { reach: 0, tempo: 0, nature: 1.5, tether: -2, aura: 0 } },
      { text: "Leave before the party ends. Goodbyes are easier when you don't actually say them.", weight: { reach: 0, tempo: 0, nature: -1.5, tether: 2, aura: 0 } },
      { text: "Stay late, but not to help. Just to be in the empty apartment one more time.", weight: { reach: 0, tempo: 0, nature: 1.5, tether: 2, aura: 0 } }
    ] },

  // -- Tether × Aura --

  { id: "q46", primary: "tether", secondary: "aura",
    text: "Do you like parties?",
    options: [
      { text: "Yes. The noise, the people, the chaos. I come alive in it.", weight: { reach: 0, tempo: 0, nature: 0, tether: -3, aura: 0.5 } },
      { text: "No. I'd rather be home.", weight: { reach: 0, tempo: 0, nature: 0, tether: 3, aura: -0.5 } }
    ] },

  { id: "q47", primary: "tether", secondary: "aura",
    text: "Somebody calls you 'weird but funny.' How does that make you feel?",
    options: [
      { text: "Happy! That's exactly what I'm going for.", weight: { reach: 0, tempo: 0, nature: 0, tether: -1, aura: 2.5 } },
      { text: "I'll take it. Weird is better than boring.", weight: { reach: 0, tempo: 0, nature: 0, tether: -1, aura: 2.5 } },
      { text: "Not happy. I wasn't trying to be weird.", weight: { reach: 0, tempo: 0, nature: 0, tether: 1, aura: -2.5 } }
    ] },

  { id: "q48", primary: "tether", secondary: "aura",
    text: "A stranger in a café is crying quietly. You notice.",
    options: [
      { text: "Go over. Ask if they're okay. Even if they say yes, stay for a minute.", weight: { reach: 0, tempo: 0, nature: 0, tether: -2, aura: -1.5 } },
      { text: "Send over a pastry with a note that says 'whatever it is, you get a free pastry.' Don't sign it.", weight: { reach: 0, tempo: 0, nature: 0, tether: -2, aura: 1.5 } },
      { text: "Nothing. They're not crying to be rescued. Giving space is its own kind of respect.", weight: { reach: 0, tempo: 0, nature: 0, tether: 2, aura: -1.5 } },
      { text: "Notice, then spend twenty minutes inventing their life story. They've lived three different lives in my head.", weight: { reach: 0, tempo: 0, nature: 0, tether: 2, aura: 1.5 } }
    ] },

  // ================================================================
  // AURA (Earnest ↔ Capricious) — 12 questions
  // ================================================================

  // -- Aura × Reach --

  { id: "q49", primary: "aura", secondary: "reach",
    text: "Do you like pranks?",
    options: [
      { text: "Yes. Both sides.", weight: { reach: 0.5, tempo: 0, nature: 0, tether: 0, aura: 3 } },
      { text: "No. People get hurt, even when nobody means to.", weight: { reach: -0.5, tempo: 0, nature: 0, tether: 0, aura: -3 } }
    ] },

  { id: "q50", primary: "aura", secondary: "reach",
    text: "Have you ever blurted something out and immediately regretted it?",
    options: [
      { text: "Yes. More times than I can count.", weight: { reach: -1, tempo: 0, nature: 0, tether: 0, aura: 2.5 } },
      { text: "Yes, and I've turned it into a bit. Now people think I'm just 'honest.'", weight: { reach: 1, tempo: 0, nature: 0, tether: 0, aura: 2.5 } },
      { text: "Rarely. I think before I speak.", weight: { reach: 0, tempo: 0, nature: 0, tether: 0, aura: -2.5 } }
    ] },

  { id: "q51", primary: "aura", secondary: "reach",
    text: "Your friend describes you to someone who's never met you. Which description would sting the most?",
    options: [
      { text: "'They're reliable. Does what they say they'll do.' — said flat, like describing a toaster.", weight: { reach: -1.5, tempo: 0, nature: 0, tether: 0, aura: -2 } },
      { text: "'They're hilarious. You never know what they'll say.' — when you were trying to be serious.", weight: { reach: -1.5, tempo: 0, nature: 0, tether: 0, aura: 2 } },
      { text: "'I don't think they really need anyone.' — said lightly, just accepted as true.", weight: { reach: 1.5, tempo: 0, nature: 0, tether: 0, aura: -2 } },
      { text: "'They're fun.' — just that. Nothing else. Like that's the whole summary.", weight: { reach: 1.5, tempo: 0, nature: 0, tether: 0, aura: 2 } }
    ] },

  // -- Aura × Tempo --

  { id: "q52", primary: "aura", secondary: "tempo",
    text: "Do you often yawn?",
    options: [
      { text: "Yes. Constantly. My body is always trying to reboot.", weight: { reach: 0, tempo: 0.5, nature: 0, tether: 0, aura: 3 } },
      { text: "No. I'm pretty alert.", weight: { reach: 0, tempo: -0.5, nature: 0, tether: 0, aura: -3 } }
    ] },

  { id: "q53", primary: "aura", secondary: "tempo",
    text: "You're daydreaming when your friend sprays you with water.",
    options: [
      { text: "Woo-hoo! Water fight!", weight: { reach: 0, tempo: -1, nature: 0, tether: 0, aura: 2.5 } },
      { text: "Get mad. That was completely uncalled for.", weight: { reach: 0, tempo: -1, nature: 0, tether: 0, aura: -2.5 } },
      { text: "Sigh deeply. Give them a look. Return to my daydream.", weight: { reach: 0, tempo: 1, nature: 0, tether: 0, aura: -2.5 } }
    ] },

  { id: "q54", primary: "aura", secondary: "tempo",
    text: "You've just been handed the microphone at karaoke. It's not a song you chose.",
    options: [
      { text: "Sing it. Badly. Enthusiastically. The badness IS the performance.", weight: { reach: 0, tempo: -1.5, nature: 0, tether: 0, aura: 2 } },
      { text: "Sing it earnestly. Even if it's a silly song, I'm going to mean every word.", weight: { reach: 0, tempo: 1.5, nature: 0, tether: 0, aura: 2 } },
      { text: "Hand the mic back. I don't sing in public. That's not shyness — it's a boundary.", weight: { reach: 0, tempo: 1.5, nature: 0, tether: 0, aura: -2 } },
      { text: "Leave. Karaoke is my nightmare. I'm already out the door.", weight: { reach: 0, tempo: -1.5, nature: 0, tether: 0, aura: -2 } }
    ] },

  // -- Aura × Nature --

  { id: "q55", primary: "aura", secondary: "nature",
    text: "Do you like groan-inducing puns?",
    options: [
      { text: "Love them. The worse the better.", weight: { reach: 0, tempo: 0, nature: -0.5, tether: 0, aura: 3 } },
      { text: "Spare me. Please.", weight: { reach: 0, tempo: 0, nature: 0.5, tether: 0, aura: -3 } }
    ] },

  { id: "q56", primary: "aura", secondary: "nature",
    text: "You see a cake that's one day past its expiration date.",
    options: [
      { text: "Not a problem! Chow time!", weight: { reach: 0, tempo: 0, nature: -1, tether: 0, aura: 2.5 } },
      { text: "Sniff it. Examine it. Google whether this is safe. Proceed with caution.", weight: { reach: 0, tempo: 0, nature: 1, tether: 0, aura: -2.5 } },
      { text: "Throw it out. Why risk it over a cake?", weight: { reach: 0, tempo: 0, nature: 1, tether: 0, aura: -2.5 } }
    ] },

  { id: "q57", primary: "aura", secondary: "nature",
    text: "Someone gives you a houseplant. Not a cute succulent — a big, dramatic fern that needs constant attention.",
    options: [
      { text: "Name it immediately. It's part of the household now.", weight: { reach: 0, tempo: 0, nature: -1.5, tether: 0, aura: 2 } },
      { text: "Research its needs. Humidity, soil pH, exact angle of indirect light. This fern will thrive or I will die trying.", weight: { reach: 0, tempo: 0, nature: 1.5, tether: 0, aura: -2 } },
      { text: "Put it in the window. Water it when I remember. If it dies it dies. We had a good run.", weight: { reach: 0, tempo: 0, nature: -1.5, tether: 0, aura: 2 } },
      { text: "Regift it immediately. I know my limits and a dramatic fern is beyond them.", weight: { reach: 0, tempo: 0, nature: 1.5, tether: 0, aura: -2 } }
    ] },

  // -- Aura × Tether --

  { id: "q58", primary: "aura", secondary: "tether",
    text: "Do you laugh a lot?",
    options: [
      { text: "Yes. Sometimes at nothing. Sometimes at the worst possible moment.", weight: { reach: 0, tempo: 0, nature: 0, tether: -0.5, aura: 3 } },
      { text: "Not really. I smile. That's different.", weight: { reach: 0, tempo: 0, nature: 0, tether: 0.5, aura: -3 } }
    ] },

  { id: "q59", primary: "aura", secondary: "tether",
    text: "Have you ever looked at your reflection and thought, 'I'm actually pretty cool'?",
    options: [
      { text: "Certainly! Multiple times.", weight: { reach: 0, tempo: 0, nature: 0, tether: 1, aura: 2.5 } },
      { text: "Well... not really. That feels weird to say out loud.", weight: { reach: 0, tempo: 0, nature: 0, tether: -1, aura: -2.5 } },
      { text: "I've thought it, but I'd never admit it. Until just now, apparently.", weight: { reach: 0, tempo: 0, nature: 0, tether: -1, aura: 2.5 } }
    ] },

  { id: "q60", primary: "aura", secondary: "tether",
    text: "A friend tells you they've started keeping a dream journal. They ask if you keep one too.",
    options: [
      { text: "Yes. Mine is unhinged. Last night I was a lighthouse. Not in a lighthouse. I WAS the lighthouse.", weight: { reach: 0, tempo: 0, nature: 0, tether: 1.5, aura: 2 } },
      { text: "No, but I tell them about the recurring dream I've had since childhood. The one with the staircase that goes nowhere.", weight: { reach: 0, tempo: 0, nature: 0, tether: -1.5, aura: -2 } },
      { text: "No, but now I want to. I'll start tomorrow. I'll probably forget by tomorrow.", weight: { reach: 0, tempo: 0, nature: 0, tether: -1.5, aura: 2 } },
      { text: "No. My dreams are boring. Spreadsheets and missed buses. I'd rather not document that.", weight: { reach: 0, tempo: 0, nature: 0, tether: 1.5, aura: -2 } }
    ] }

];
