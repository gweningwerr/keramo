<?php
namespace AppBundle\Controller\Admin;


/**
 * class: DashboardAdmController
 * -----------------------------------------------------
 * Created by MihailShirnin on 31.08.2016.
 */

class DashboardAdmController extends ExtendsAdmController
{

	public function indexAction()
	{

//	    /**
//	     * @var BannerRepository
//	     */
//    	$Testing = App::getRepository('AppBundle:Testing');
//	    App::dump($Testing->findAll());
//	    App::dump( App::getCurLocale());
		// replace this example code with whatever you need
		return $this->render('AppBundle:Adminka:layout.html.twig', [
			'base_dir' => realpath($this->getParameter('kernel.root_dir').'/..'),
		]);
	}
}

