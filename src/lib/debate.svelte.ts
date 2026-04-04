export type DebateSide = 'for' | 'against';
export type DebatePhase = 'setup' | 'loading' | 'arguing' | 'judging' | 'results';

export interface Turn {
	speaker: 'user' | 'ai';
	text: string;
	timestamp: number;
}

export interface DebateState {
	topic: string;
	userSide: DebateSide;
	aiSide: DebateSide;
	phase: DebatePhase;
	turns: Turn[];
	roundNumber: number;
	maxRounds: number;
	verdict: string;
	winner: 'user' | 'ai' | 'draw' | null;
}

function createDebateStore() {
	let topic = $state('');
	let userSide = $state<DebateSide>('for');
	let aiSide = $state<DebateSide>('against');
	let phase = $state<DebatePhase>('setup');
	let turns = $state<Turn[]>([]);
	let roundNumber = $state(0);
	const maxRounds = 4;
	let verdict = $state('');
	let winner = $state<'user' | 'ai' | 'draw' | null>(null);

	return {
		get topic() {
			return topic;
		},
		get userSide() {
			return userSide;
		},
		get aiSide() {
			return aiSide;
		},
		get phase() {
			return phase;
		},
		get turns() {
			return turns;
		},
		get roundNumber() {
			return roundNumber;
		},
		get maxRounds() {
			return maxRounds;
		},
		get verdict() {
			return verdict;
		},
		get winner() {
			return winner;
		},
		get isDebateOver() {
			return roundNumber >= maxRounds;
		},

		startDebate(t: string, side: DebateSide) {
			topic = t;
			userSide = side;
			aiSide = side === 'for' ? 'against' : 'for';
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

		setVerdict(v: string, w: 'user' | 'ai' | 'draw') {
			verdict = v;
			winner = w;
			phase = 'results';
		},

		reset() {
			topic = '';
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
