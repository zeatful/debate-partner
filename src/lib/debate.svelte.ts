export type DebateMode = 'human-vs-ai' | 'ai-vs-ai';
export type DebateSide = 'for' | 'against';
export type DebatePhase = 'setup' | 'loading' | 'arguing' | 'judging' | 'results';
export type DebateWinner = 'user' | 'ai' | 'ai1' | 'ai2' | 'draw';

export interface Turn {
	speaker: 'user' | 'ai' | 'ai1' | 'ai2';
	text: string;
	timestamp: number;
}

export interface DebateState {
	topic: string;
	mode: DebateMode;
	userSide: DebateSide;
	aiSide: DebateSide;
	phase: DebatePhase;
	turns: Turn[];
	roundNumber: number;
	maxRounds: number;
	verdict: string;
	winner: DebateWinner | null;
}

function createDebateStore() {
	let topic = $state('');
	let mode = $state<DebateMode>('human-vs-ai');
	let userSide = $state<DebateSide>('for');
	let aiSide = $state<DebateSide>('against');
	let phase = $state<DebatePhase>('setup');
	let turns = $state<Turn[]>([]);
	let roundNumber = $state(0);
	const maxRounds = 4;
	let verdict = $state('');
	let winner = $state<DebateWinner | null>(null);

	return {
		get topic() { return topic; },
		get mode() { return mode; },
		get userSide() { return userSide; },
		get aiSide() { return aiSide; },
		// In ai-vs-ai mode, ai1 is always FOR, ai2 is always AGAINST
		get ai1Side(): DebateSide { return 'for'; },
		get ai2Side(): DebateSide { return 'against'; },
		get phase() { return phase; },
		get turns() { return turns; },
		get roundNumber() { return roundNumber; },
		get maxRounds() { return maxRounds; },
		get verdict() { return verdict; },
		get winner() { return winner; },
		get isDebateOver() { return roundNumber >= maxRounds; },

		startDebate(t: string, side: DebateSide) {
			topic = t;
			mode = 'human-vs-ai';
			userSide = side;
			aiSide = side === 'for' ? 'against' : 'for';
			phase = 'loading';
			turns = [];
			roundNumber = 0;
			verdict = '';
			winner = null;
		},

		startAiVsAiDebate(t: string) {
			topic = t;
			mode = 'ai-vs-ai';
			userSide = 'for';   // unused in ai-vs-ai, but keep for compat
			aiSide = 'against'; // unused in ai-vs-ai
			phase = 'loading';
			turns = [];
			roundNumber = 0;
			verdict = '';
			winner = null;
		},

		setPhase(p: DebatePhase) {
			phase = p;
		},

		addUserTurn(text: string) {
			turns = [...turns, { speaker: 'user', text, timestamp: Date.now() }];
			roundNumber += 1;
		},

		addAiTurn(text: string) {
			turns = [...turns, { speaker: 'ai', text, timestamp: Date.now() }];
		},

		// AI vs AI: ai1 speaks first (FOR). Does NOT increment roundNumber.
		addAi1Turn(text: string) {
			turns = [...turns, { speaker: 'ai1', text, timestamp: Date.now() }];
		},

		// AI vs AI: ai2 responds (AGAINST). Increments roundNumber (end of exchange).
		addAi2Turn(text: string) {
			turns = [...turns, { speaker: 'ai2', text, timestamp: Date.now() }];
			roundNumber += 1;
		},

		setVerdict(v: string, w: DebateWinner) {
			verdict = v;
			winner = w;
			phase = 'results';
		},

		reset() {
			topic = '';
			mode = 'human-vs-ai';
			userSide = 'for';
			aiSide = 'against';
			phase = 'setup';
			turns = [];
			roundNumber = 0;
			verdict = '';
			winner = null;
		}
	};
}

export const debate = createDebateStore();
