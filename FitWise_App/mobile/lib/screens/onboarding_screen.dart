import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../main.dart';
import '../theme.dart';

class _OnboardingStep {
  final String emoji;
  final String title;
  final String body;
  const _OnboardingStep(this.emoji, this.title, this.body);
}

const _steps = [
  _OnboardingStep('🧠', 'Personalised recommendations', 'Receive a workout-type recommendation based on your fitness goal, experience and profile.'),
  _OnboardingStep('📅', 'Weekly plans that fit your life', 'Follow a structured workout plan designed around your availability, equipment and restrictions.'),
  _OnboardingStep('📊', 'See progress that motivates you', 'Track workouts, adherence, measurements and estimated progress over time.'),
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _step = 0;

  Future<void> _finish() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(onboardingSeenKey, true);
    if (!mounted) return;
    // Route to AuthGate (not LoginScreen directly) -- AuthGate's
    // StreamBuilder is what reacts to a successful sign-in and swaps to
    // HomeShell; bypassing it here would leave nothing listening for that.
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const AuthGate()));
  }

  @override
  Widget build(BuildContext context) {
    final step = _steps[_step];
    return Scaffold(
      backgroundColor: FitWiseColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: _finish,
                  child: const Text('Skip', style: TextStyle(color: FitWiseColors.blue, fontWeight: FontWeight.w800)),
                ),
              ),
              const Spacer(),
              Text(step.emoji, style: const TextStyle(fontSize: 90)),
              const SizedBox(height: 24),
              Text(
                step.title,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: FitWiseColors.navy),
              ),
              const SizedBox(height: 12),
              Text(
                step.body,
                textAlign: TextAlign.center,
                style: const TextStyle(color: FitWiseColors.muted, height: 1.5),
              ),
              const Spacer(),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_steps.length, (i) {
                  final active = i == _step;
                  return Container(
                    width: active ? 20 : 8,
                    height: 8,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: active ? FitWiseColors.blue : const Color(0xFFD9E3EF),
                      borderRadius: BorderRadius.circular(999),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {
                    if (_step < _steps.length - 1) {
                      setState(() => _step += 1);
                    } else {
                      _finish();
                    }
                  },
                  child: Text(_step < _steps.length - 1 ? 'Next' : 'Get Started'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
