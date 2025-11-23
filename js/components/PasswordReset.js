/**
 * Password Reset Component
 * Sistema di reset password basato su domande di sicurezza (senza Firebase Auth)
 * Tutto gestito via Firestore database
 */

window.PasswordReset = function({ db, darkMode, onClose, onSuccess }) {
    const [step, setStep] = React.useState(1); // 1: email, 2: security questions, 3: new password
    const [email, setEmail] = React.useState('');
    const [user, setUser] = React.useState(null);
    const [securityAnswers, setSecurityAnswers] = React.useState({
        answer1: '',
        answer2: ''
    });
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showNewPassword, setShowNewPassword] = React.useState(false); // 👁️
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false); // 👁️
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    
    const t = window.translations || {};

    // Styles
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const inputClass = darkMode 
        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
    const buttonPrimary = darkMode 
        ? 'bg-blue-600 hover:bg-blue-700' 
        : 'bg-blue-500 hover:bg-blue-600';
    const buttonSecondary = darkMode 
        ? 'bg-gray-600 hover:bg-gray-700' 
        : 'bg-gray-300 hover:bg-gray-400 text-gray-800';

    // Toast helper
    const showToast = (message, type = 'info') => {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    };

    // Step 1: Verifica email
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Query Firestore per email
            const usersSnapshot = await db.collection('users')
                .where('email', '==', email.trim().toLowerCase())
                .limit(1)
                .get();

            if (usersSnapshot.empty) {
                setError(t.emailNotFound || 'Email non trovata nel sistema');
                setLoading(false);
                return;
            }

            const userData = usersSnapshot.docs[0];
            const userInfo = { id: userData.id, ...userData.data() };

            // Verifica che l'utente abbia domande di sicurezza
            if (!userInfo.securityAnswers || !userInfo.securityAnswers.question1 || !userInfo.securityAnswers.question2) {
                setError(t.noSecurityQuestions || 'Questo utente non ha configurato domande di sicurezza. Contatta l\'amministratore.');
                setLoading(false);
                return;
            }

            setUser(userInfo);
            setStep(2);
            showToast('✅ Email verificata! Rispondi alle domande di sicurezza', 'success');
        } catch (err) {
            console.error('Errore verifica email:', err);
            setError(t.errorVerifyingEmail || 'Errore durante la verifica dell\'email');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verifica risposte domande di sicurezza
    const handleSecurityAnswersSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Verifica risposte (case-insensitive, trimmed)
            const answer1Input = securityAnswers.answer1.trim().toLowerCase();
            const answer2Input = securityAnswers.answer2.trim().toLowerCase();
            
            // Se le risposte sono hashate, usa bcrypt.compareSync, altrimenti confronto diretto
            let answer1Correct, answer2Correct;
            
            if (user.securityAnswers.answer1.startsWith('$2')) {
                // Hash bcrypt (starts with $2a$ or $2b$)
                answer1Correct = window.bcrypt.compareSync(answer1Input, user.securityAnswers.answer1);
                answer2Correct = window.bcrypt.compareSync(answer2Input, user.securityAnswers.answer2);
            } else {
                // Plain text (backward compatibility)
                answer1Correct = answer1Input === user.securityAnswers.answer1.trim().toLowerCase();
                answer2Correct = answer2Input === user.securityAnswers.answer2.trim().toLowerCase();
            }

            if (!answer1Correct || !answer2Correct) {
                setError(t.incorrectSecurityAnswers || 'Risposte errate. Riprova.');
                setLoading(false);
                return;
            }

            setStep(3);
            showToast('✅ Risposte corrette! Ora imposta una nuova password', 'success');
        } catch (err) {
            console.error('Errore verifica risposte:', err);
            setError(t.errorVerifyingAnswers || 'Errore durante la verifica delle risposte');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Imposta nuova password
    const handlePasswordResetSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validazione password
            if (newPassword.length < 6) {
                setError(t.passwordTooShort || 'La password deve essere di almeno 6 caratteri');
                setLoading(false);
                return;
            }

            if (newPassword !== confirmPassword) {
                setError(t.passwordsDoNotMatch || 'Le password non corrispondono');
                setLoading(false);
                return;
            }

            // Hash password con bcrypt
            const hashedPassword = window.bcrypt.hashSync(newPassword, 10);

            // Aggiorna password in Firestore
            await db.collection('users').doc(user.id).update({
                password: hashedPassword,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                passwordResetAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showToast('✅ Password reimpostata con successo!', 'success');
            
            // Chiama callback successo
            if (onSuccess) {
                onSuccess();
            }

            // Chiudi modale dopo 2 secondi
            setTimeout(() => {
                if (onClose) onClose();
            }, 2000);

        } catch (err) {
            console.error('Errore reset password:', err);
            setError(t.errorResettingPassword || 'Errore durante il reset della password');
        } finally {
            setLoading(false);
        }
    };

    // Render Step 1: Email Input
    const renderEmailStep = () => {
        return React.createElement('form', {
            onSubmit: handleEmailSubmit,
            className: 'space-y-4'
        },
            React.createElement('div', null,
                React.createElement('label', {
                    className: 'block text-sm font-medium mb-2'
                }, t.email || 'Email'),
                React.createElement('input', {
                    type: 'email',
                    value: email,
                    onChange: (e) => setEmail(e.target.value),
                    placeholder: 'mario.rossi@example.com',
                    required: true,
                    autoFocus: true,
                    className: `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${inputClass}`
                })
            ),

            error && React.createElement('div', {
                className: 'p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm'
            }, error),

            React.createElement('div', { className: 'flex gap-3' },
                React.createElement('button', {
                    type: 'button',
                    onClick: onClose,
                    disabled: loading,
                    className: `flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${buttonSecondary}`
                }, t.cancel || 'Annulla'),

                React.createElement('button', {
                    type: 'submit',
                    disabled: loading || !email.trim(),
                    className: `flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonPrimary}`
                }, loading ? '⏳ Verifica...' : (t.continue || 'Continua'))
            )
        );
    };

    // Render Step 2: Security Questions
    const renderSecurityQuestionsStep = () => {
        return React.createElement('form', {
            onSubmit: handleSecurityAnswersSubmit,
            className: 'space-y-4'
        },
            React.createElement('div', {
                className: `p-4 ${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-lg mb-4`
            },
                React.createElement('p', {
                    className: 'text-sm font-medium'
                }, `✉️ ${user?.email}`)
            ),

            React.createElement('div', null,
                React.createElement('label', {
                    className: 'block text-sm font-medium mb-2'
                }, `🔒 ${user?.securityAnswers?.question1}`),
                React.createElement('input', {
                    type: 'text',
                    value: securityAnswers.answer1,
                    onChange: (e) => setSecurityAnswers({ ...securityAnswers, answer1: e.target.value }),
                    placeholder: t.yourAnswer || 'La tua risposta',
                    required: true,
                    autoFocus: true,
                    className: `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${inputClass}`
                })
            ),

            React.createElement('div', null,
                React.createElement('label', {
                    className: 'block text-sm font-medium mb-2'
                }, `🔒 ${user?.securityAnswers?.question2}`),
                React.createElement('input', {
                    type: 'text',
                    value: securityAnswers.answer2,
                    onChange: (e) => setSecurityAnswers({ ...securityAnswers, answer2: e.target.value }),
                    placeholder: t.yourAnswer || 'La tua risposta',
                    required: true,
                    className: `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${inputClass}`
                })
            ),

            error && React.createElement('div', {
                className: 'p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm'
            }, error),

            React.createElement('div', { className: 'flex gap-3' },
                React.createElement('button', {
                    type: 'button',
                    onClick: () => setStep(1),
                    disabled: loading,
                    className: `flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${buttonSecondary}`
                }, '← ' + (t.back || 'Indietro')),

                React.createElement('button', {
                    type: 'submit',
                    disabled: loading || !securityAnswers.answer1.trim() || !securityAnswers.answer2.trim(),
                    className: `flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonPrimary}`
                }, loading ? '⏳ Verifica...' : (t.verify || 'Verifica'))
            )
        );
    };

    // Render Step 3: New Password
    const renderNewPasswordStep = () => {
        const passwordStrength = newPassword.length < 6 ? 'weak' : newPassword.length < 10 ? 'medium' : 'strong';
        const strengthColors = {
            weak: 'bg-red-500',
            medium: 'bg-yellow-500',
            strong: 'bg-green-500'
        };
        const strengthLabels = {
            weak: t.weak || 'Debole',
            medium: t.medium || 'Media',
            strong: t.strong || 'Forte'
        };

        return React.createElement('form', {
            onSubmit: handlePasswordResetSubmit,
            className: 'space-y-4'
        },
            React.createElement('div', {
                className: `p-4 ${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'} border rounded-lg mb-4`
            },
                React.createElement('p', {
                    className: 'text-sm font-medium'
                }, `✅ Identità verificata per ${user?.email}`)
            ),

            React.createElement('div', null,
                React.createElement('label', {
                    className: 'block text-sm font-medium mb-2'
                }, t.newPassword || 'Nuova Password'),
                React.createElement('div', { className: 'relative' },
                    React.createElement('input', {
                        type: showNewPassword ? 'text' : 'password',
                        value: newPassword,
                        onChange: (e) => setNewPassword(e.target.value),
                        placeholder: '••••••••',
                        required: true,
                        autoFocus: true,
                        minLength: 6,
                        className: `w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${inputClass}`
                    }),
                    React.createElement('button', {
                        type: 'button',
                        onClick: () => setShowNewPassword(!showNewPassword),
                        className: `absolute right-2 top-1/2 -translate-y-1/2 text-xl transition-all hover:scale-110 ${
                            darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                        }`,
                        title: showNewPassword ? 'Nascondi' : 'Mostra'
                    }, showNewPassword ? '🙈' : '👁️')
                ),
                
                // Password strength indicator
                newPassword && React.createElement('div', { className: 'mt-2' },
                    React.createElement('div', { className: 'flex items-center gap-2' },
                        React.createElement('div', { className: 'flex-1 h-2 bg-gray-200 rounded-full overflow-hidden' },
                            React.createElement('div', {
                                className: `h-full ${strengthColors[passwordStrength]} transition-all`,
                                style: { width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%' }
                            })
                        ),
                        React.createElement('span', {
                            className: 'text-xs font-medium'
                        }, strengthLabels[passwordStrength])
                    )
                )
            ),

            React.createElement('div', null,
                React.createElement('label', {
                    className: 'block text-sm font-medium mb-2'
                }, t.confirmPassword || 'Conferma Password'),
                React.createElement('div', { className: 'relative' },
                    React.createElement('input', {
                        type: showConfirmPassword ? 'text' : 'password',
                        value: confirmPassword,
                        onChange: (e) => setConfirmPassword(e.target.value),
                        placeholder: '••••••••',
                        required: true,
                        minLength: 6,
                        className: `w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${inputClass}`
                    }),
                    React.createElement('button', {
                        type: 'button',
                        onClick: () => setShowConfirmPassword(!showConfirmPassword),
                        className: `absolute right-2 top-1/2 -translate-y-1/2 text-xl transition-all hover:scale-110 ${
                            darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                        }`,
                        title: showConfirmPassword ? 'Nascondi' : 'Mostra'
                    }, showConfirmPassword ? '🙈' : '👁️')
                )
            ),

            error && React.createElement('div', {
                className: 'p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm'
            }, error),

            React.createElement('div', { className: 'flex gap-3' },
                React.createElement('button', {
                    type: 'button',
                    onClick: () => setStep(2),
                    disabled: loading,
                    className: `flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${buttonSecondary}`
                }, '← ' + (t.back || 'Indietro')),

                React.createElement('button', {
                    type: 'submit',
                    disabled: loading || !newPassword || !confirmPassword || newPassword !== confirmPassword,
                    className: `flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonPrimary}`
                }, loading ? '⏳ Reset...' : '✅ ' + (t.resetPassword || 'Reset Password'))
            )
        );
    };

    // Main render
    return React.createElement('div', {
        className: 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4',
        onClick: (e) => {
            if (e.target === e.currentTarget && !loading) {
                onClose();
            }
        }
    },
        React.createElement('div', {
            className: `${cardClass} rounded-xl shadow-2xl max-w-md w-full p-6`,
            onClick: (e) => e.stopPropagation()
        },
            // Header
            React.createElement('div', { className: 'mb-6' },
                React.createElement('div', { className: 'flex items-center justify-between mb-2' },
                    React.createElement('h2', {
                        className: 'text-2xl font-bold'
                    }, '🔐 ' + (t.resetPassword || 'Reset Password')),
                    
                    React.createElement('button', {
                        onClick: onClose,
                        disabled: loading,
                        className: `${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} p-2 rounded-lg transition-colors disabled:opacity-50`
                    }, '✖')
                ),

                // Progress indicator
                React.createElement('div', { className: 'flex gap-2 mt-4' },
                    [1, 2, 3].map(s => 
                        React.createElement('div', {
                            key: s,
                            className: `flex-1 h-1 rounded-full ${
                                s === step ? (darkMode ? 'bg-blue-500' : 'bg-blue-600') : 
                                s < step ? (darkMode ? 'bg-green-500' : 'bg-green-600') : 
                                (darkMode ? 'bg-gray-700' : 'bg-gray-300')
                            }`
                        })
                    )
                ),

                React.createElement('p', {
                    className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`
                }, 
                    step === 1 ? (t.step1Description || 'Inserisci la tua email') :
                    step === 2 ? (t.step2Description || 'Rispondi alle domande di sicurezza') :
                    (t.step3Description || 'Imposta una nuova password')
                )
            ),

            // Content based on step
            step === 1 ? renderEmailStep() :
            step === 2 ? renderSecurityQuestionsStep() :
            renderNewPasswordStep()
        )
    );
};
