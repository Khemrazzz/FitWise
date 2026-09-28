import 'package:flutter/material.dart';

import '../theme.dart';
import 'home_tab.dart';
import 'plan_tab.dart';
import 'profile_tab.dart';
import 'progress_tab.dart';
import 'workouts_tab.dart';

// Bottom-nav shell matching the POC's `.phone-nav` (Home/Plan/Workouts/
// Progress/Profile) -- the container all the member-facing tabs live in.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _titles = ['Home', 'Plan', 'Workouts', 'Progress', 'Profile'];
  static const _tabs = [HomeTab(), PlanTab(), WorkoutsTab(), ProgressTab(), ProfileTab()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: FitWiseColors.background,
      appBar: AppBar(title: Text(_titles[_index])),
      body: SafeArea(child: IndexedStack(index: _index, children: _tabs)),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: FitWiseColors.surface,
        indicatorColor: FitWiseColors.blueSoft,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home, color: FitWiseColors.blue), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.calendar_today_outlined), selectedIcon: Icon(Icons.calendar_today, color: FitWiseColors.blue), label: 'Plan'),
          NavigationDestination(icon: Icon(Icons.fitness_center_outlined), selectedIcon: Icon(Icons.fitness_center, color: FitWiseColors.blue), label: 'Workouts'),
          NavigationDestination(icon: Icon(Icons.show_chart_outlined), selectedIcon: Icon(Icons.show_chart, color: FitWiseColors.blue), label: 'Progress'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person, color: FitWiseColors.blue), label: 'Profile'),
        ],
      ),
    );
  }
}
