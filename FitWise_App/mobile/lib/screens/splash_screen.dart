import 'package:flutter/material.dart';

import '../theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFEEF5FF), Color(0xFFF7FBFF), Color(0xFFEAFAF6)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const FitWiseBrand(size: 30),
                  const SizedBox(height: 17),
                  const Text(
                    'Personalised Fitness Recommendation System',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: FitWiseColors.navy),
                  ),
                  const SizedBox(height: 7),
                  const Text('Smarter fitness, personalised for you.', style: TextStyle(color: FitWiseColors.muted)),
                  const SizedBox(height: 32),
                  const Text('🏃‍♀️', style: TextStyle(fontSize: 90)),
                  const SizedBox(height: 32),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: SizedBox(
                      width: 140,
                      height: 6,
                      child: LinearProgressIndicator(
                        backgroundColor: const Color(0xFFD9E4F1),
                        valueColor: const AlwaysStoppedAnimation(FitWiseColors.blue),
                        value: 0.72,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text('Loading your personalised experience...', style: TextStyle(color: FitWiseColors.muted, fontSize: 12)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
