(function() {
    "use strict";

    Macro.add('th-set', {
        skipArgs: true,
        handler: function() {
            if (this.args.raw.length === 0) {
                return this.error('th-set macro requires arguments');
            }

            // ── LOCAL UPDATE ────────────────────────────────────────────────
            // Delegate to evalJavaScript(this.args.full) exactly like <<set>>.
            //
            // With skipArgs:true, SugarCube provides this.args.full with all
            // TwineScript already desugared to plain JS:
            //   $var  → State.variables.var
            //   _var  → State.temporary.var
            //   to    → =
            //   eq    → ==, neq → !=, is → ===, etc.
            //
            // So  <<th-set $users[$userId].name to _draft>>
            // becomes  State.variables.users[State.variables.userId].name = State.temporary.draft
            // and evalJavaScript handles it identically to <<set>>.
            try {
                Scripting.evalJavaScript(this.args.full);
            } catch (ex) {
                return this.error(`bad evaluation: ${typeof ex === 'object' ? ex.message : ex}`);
            }

            // ── SERVER SYNC ─────────────────────────────────────────────────
            // Parse this.args.raw (unprocessed Twine) to extract the variable
            // path, operator, and RHS expression for the server.
            const assignMatch = this.args.raw.trim().match(
                /^(['"]?)(\$[a-zA-Z_][\w.\[\]"'$]*)(\1)(\s*)(=|\+=|-=|\*=|\/=|%=|\bto\b)(\s*)(.+)$/i
            );

            if (assignMatch) {
                const varPath  = assignMatch[2];
                let operator   = assignMatch[5].trim().toLowerCase();
                if (operator === 'to') operator = '=';
                const rightExpr = assignMatch[7];

                // Resolve runtime variable names inside brackets:
                //   $users[$userId] → $users["alice"]
                const resolvedVarPath = varPath.replace(/\[\s*(\$[a-zA-Z_]\w*)\s*\]/g, (m, v) => {
                    try { return "[" + JSON.stringify(State.getVar(v)) + "]"; }
                    catch (e) { return m; }
                });

                const isException = window.exceptions && window.exceptions.some(ex =>
                    varPath === ex || varPath.startsWith(ex.replace('$', '') + '.')
                );

                if (!isException && window.socket && window.socket.connected) {
                    try {
                        const rightValue = Scripting.evalTwineScript(rightExpr);

                        if (operator === '=') {
                            window.sendStateUpdate(resolvedVarPath, rightValue);
                        } else {
                            const opNames = {
                                '+=': 'add', '-=': 'subtract',
                                '*=': 'multiply', '/=': 'divide', '%=': 'modulus'
                            };
                            window.sendAtomicUpdate(resolvedVarPath, opNames[operator], rightValue);
                        }
                    } catch (e) {
                        console.warn('[th-set] Server sync failed:', e);
                    }
                }
            }

            if (window.thLiveUpdate) window.thLiveUpdate(); else $(document).trigger(':liveupdate');
        }
    });
})();
