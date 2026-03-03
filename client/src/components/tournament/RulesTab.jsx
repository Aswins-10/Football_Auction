export default function RulesTab({ tournament }) {
    const rules = [
        { icon: '💰', title: 'Starting Budget', desc: `Each team receives ${tournament.budgetPerTeam}M to spend.` },
        { icon: '⏱️', title: 'Bidding Timer', desc: `Each player gets ${tournament.timerDuration} seconds of bidding. Timer resets on every valid bid.` },
        { icon: '📈', title: 'Bid Increments', desc: 'Under 25M: +2.5M per bid. Under 100M: +5M. 100M+: +10M.' },
        { icon: '🚫', title: 'Quit Button', desc: 'You can quit bidding on a player. Once quit, you cannot bid again for that player. If everyone else quits, remaining bidder wins instantly.' },
        { icon: '🏃', title: 'Squad Limit', desc: `Each team can have max ${tournament.squadSizeLimit} players. Budget runs out = cannot bid.` },
        { icon: '❌', title: 'Unsold Players', desc: 'If no team bids above base price, player is marked UNSOLD.' },
        { icon: '⚡', title: 'Auto-Sell', desc: 'When only one team remains active, instant sale — no need to wait for timer.' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((r) => (
                <div key={r.title} className="glass rounded-xl p-5 flex gap-4 card-hover">
                    <div className="text-3xl">{r.icon}</div>
                    <div>
                        <h3 className="font-bold text-sm mb-1">{r.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{r.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
