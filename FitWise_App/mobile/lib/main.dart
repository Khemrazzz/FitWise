import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/splash_screen.dart';
import 'theme.dart';

const onboardingSeenKey = 'fitwise_onboarding_seen';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load();
  await Supabase.initialize(
    url: dotenv.env['SUPABASE_URL']!,
    publishableKey: dotenv.env['SUPABASE_ANON_KEY']!,
  );
  runApp(const FitWiseApp());
}

final supabase = Supabase.instance.client;

class FitWiseApp extends StatelessWidget {
  const FitWiseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FitWise',
      theme: buildFitWiseTheme(),
      home: const SplashGate(),
    );
  }
}

// Shows the branded splash for a beat, then checks auth state and whether
// onboarding has been seen before, and routes accordingly.
class SplashGate extends StatefulWidget {
  const SplashGate({super.key});

  @override
  State<SplashGate> createState() => _SplashGateState();
}

class _SplashGateState extends State<SplashGate> {
  bool _ready = false;
  bool _onboardingSeen = false;

  @override
  void initState() {
    super.initState();
    _prepare();
  }

  Future<void> _prepare() async {
    final prefs = await SharedPreferences.getInstance();
    final seen = prefs.getBool(onboardingSeenKey) ?? false;
    await Future.delayed(const Duration(milliseconds: 1400));
    if (mounted) setState(() { _onboardingSeen = seen; _ready = true; });
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) return const SplashScreen();
    if (supabase.auth.currentSession == null && !_onboardingSeen) return const OnboardingScreen();
    return const AuthGate();
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: supabase.auth.onAuthStateChange,
      builder: (context, snapshot) {
        final session = supabase.auth.currentSession;
        return session == null ? const LoginScreen() : const HomeShell();
      },
    );
  }
}
